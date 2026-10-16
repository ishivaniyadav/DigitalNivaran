
const express = require("express")
const crypto = require("crypto")

const Complaint = require("../models/Complaint")
const cloudinary = require("../config/cloudinary")
const imageUpload = require("../middleware/imageUpload")

const protect = require("../middleware/authMiddleware")
const requireAuthority = require("../middleware/roleMiddleware")

const {
  predictCategory,
  predictPriority,
  checkDuplicate,
  detectHotspots,
  verifyImageEvidence
} = require("../services/mlService")

const router = express.Router()

const MAX_GPS_ACCURACY = 150
const MAX_CAPTURE_AGE_MS = 10 * 60 * 1000
const MAX_FUTURE_CLOCK_SKEW_MS = 60 * 1000
const MIN_IMAGE_CONFIDENCE = 0.6

const parseEvidenceImage = (req, res, next) => {
  imageUpload.single("evidenceImage")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Image must be 5 MB or smaller"
            : error.message || "Invalid image upload"
      })
    }

    next()
  })
}

const hasValidImageSignature = (buffer, mimeType) => {
  if (!buffer || buffer.length < 12) {
    return false
  }

  if (mimeType === "image/jpeg") {
    return (
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    )
  }

  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(
      Buffer.from([
        0x89, 0x50, 0x4e, 0x47,
        0x0d, 0x0a, 0x1a, 0x0a
      ])
    )
  }

  if (mimeType === "image/webp") {
    return (
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    )
  }

  return false
}

const uploadImageToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "smart-community/evidence",
        resource_type: "image",
        format: "jpg"
      },
      (error, result) => {
        if (error) {
          return reject(error)
        }

        resolve(result)
      }
    )

    uploadStream.end(buffer)
  })
}

const isValidCoordinate = (value, min, max) => {
  const number = Number(value)

  return (
    value !== undefined &&
    value !== null &&
    value !== "" &&
    Number.isFinite(number) &&
    number >= min &&
    number <= max
  )
}

router.post(
  "/",
  protect,
  parseEvidenceImage,
  async (req, res) => {
    let uploadedImage = null

    try {
      const {
        description,
        location,
        severity,
        latitude,
        longitude,
        captureAccuracy,
        capturedAt
      } = req.body

      if (
        typeof description !== "string" ||
        !description.trim() ||
        typeof location !== "string" ||
        !location.trim() ||
        severity === undefined ||
        severity === "" ||
        !isValidCoordinate(latitude, -90, 90) ||
        !isValidCoordinate(longitude, -180, 180) ||
        captureAccuracy === undefined ||
        captureAccuracy === "" ||
        capturedAt === undefined ||
        capturedAt === ""
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Description, location, severity, valid coordinates, capture accuracy, and capture time are required"
        })
      }

      const numericSeverity = Number(severity)
      const numericAccuracy = Number(captureAccuracy)
      const captureDate = new Date(capturedAt)
      const now = Date.now()

      if (
        !Number.isInteger(numericSeverity) ||
        numericSeverity < 1 ||
        numericSeverity > 3
      ) {
        return res.status(400).json({
          success: false,
          message: "Severity must be 1, 2, or 3"
        })
      }

      if (
        !Number.isFinite(numericAccuracy) ||
        numericAccuracy < 0 ||
        numericAccuracy > MAX_GPS_ACCURACY
      ) {
        return res.status(400).json({
          success: false,
          message: "GPS accuracy must be 150 metres or better"
        })
      }

      if (
        Number.isNaN(captureDate.getTime()) ||
        captureDate.getTime() > now + MAX_FUTURE_CLOCK_SKEW_MS ||
        now - captureDate.getTime() > MAX_CAPTURE_AGE_MS
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Capture time is invalid or too old. Please capture a new photo."
        })
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "A new camera-captured issue image is required"
        })
      }

      if (
        !hasValidImageSignature(
          req.file.buffer,
          req.file.mimetype
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The uploaded file does not contain a supported image signature"
        })
      }

      const cleanDescription = description.trim()
      const cleanLocation = location.trim()

      const imageHash = crypto
        .createHash("sha256")
        .update(req.file.buffer)
        .digest("hex")

      const existingImage = await Complaint.findOne(
        { imageHash },
        { _id: 1, userId: 1, status: 1 }
      )

      const predictedCategory = await predictCategory(
        cleanDescription
      )

      let imageVerification = null

      try {
        imageVerification = await verifyImageEvidence(
          req.file.buffer,
          req.file.mimetype,
          cleanDescription,
          predictedCategory
        )
      } catch (verificationError) {
        console.error(
          "Image verification unavailable:",
          verificationError.message
        )
      }

      const previousComplaints = await Complaint.find(
        {},
        { description: 1 }
      ).sort({ createdAt: -1 })

      const existingDescriptions = previousComplaints.map(
        (complaint) => complaint.description
      )

      const duplicateResult = await checkDuplicate(
        cleanDescription,
        existingDescriptions
      )

      const predictedPriority = await predictPriority(
        predictedCategory,
        numericSeverity,
        1,
        0
      )

      let duplicateOf = null

      if (
        duplicateResult.is_duplicate &&
        Number.isInteger(duplicateResult.matched_index) &&
        duplicateResult.matched_index >= 0 &&
        duplicateResult.matched_index < previousComplaints.length
      ) {
        duplicateOf =
          previousComplaints[duplicateResult.matched_index]._id
      }

      uploadedImage = await uploadImageToCloudinary(
        req.file.buffer
      )

      const rawConfidence = imageVerification?.confidence

      const hasValidConfidence =
        typeof rawConfidence === "number" &&
        Number.isFinite(rawConfidence) &&
        rawConfidence >= 0 &&
        rawConfidence <= 1

      const confidence = hasValidConfidence
        ? rawConfidence
        : null

      const verificationAvailable =
        imageVerification?.success === true &&
        typeof imageVerification.predicted_category === "string" &&
        imageVerification.predicted_category.trim().length > 0 &&
        typeof imageVerification.category_match === "boolean" &&
        hasValidConfidence

      const imagePredictedCategory = verificationAvailable
        ? imageVerification.predicted_category
        : ""

      let imageVerificationStatus = "Pending"
      let evidenceReviewReason =
        "AI image verification is pending."

      if (existingImage) {
        imageVerificationStatus = "Needs Review"
        evidenceReviewReason =
          "An identical image has been submitted before. Manual review is required."
      } else if (!verificationAvailable) {
        imageVerificationStatus = "Needs Review"
        evidenceReviewReason =
          "AI image verification is unavailable or returned an incomplete result. Manual review is required."
      } else if (!imageVerification.category_match) {
        imageVerificationStatus = "Mismatch"
        evidenceReviewReason =
          "The predicted image category does not match the complaint category. Manual review is required."
      } else if (confidence < MIN_IMAGE_CONFIDENCE) {
        imageVerificationStatus = "Needs Review"
        evidenceReviewReason =
          "The image category prediction has a low relative score. Manual review is required."
      } else {
        imageVerificationStatus = "Likely Supported"
        evidenceReviewReason =
          "The image appears consistent with the predicted complaint category. This does not prove image authenticity or capture location; human review is still recommended."
      }

      if (
        verificationAvailable &&
        typeof imageVerification.review_reason === "string" &&
        imageVerification.review_reason.trim()
      ) {
        evidenceReviewReason +=
          ` AI note: ${imageVerification.review_reason.trim()}`
      }

      if (hasValidConfidence) {
        evidenceReviewReason +=
          ` Model confidence: ${(confidence * 100).toFixed(1)}%.`
      }

      const isDuplicate =
        Boolean(duplicateResult.is_duplicate) ||
        Boolean(existingImage)

      const complaint = await Complaint.create({
        userId: req.user.userId,
        description: cleanDescription,
        category: predictedCategory,
        location: cleanLocation,
        latitude: Number(latitude),
        longitude: Number(longitude),
        severity: numericSeverity,
        priority: predictedPriority,

        imageUrl: uploadedImage.secure_url,
        imagePublicId: uploadedImage.public_id,
        imageHash,

        captureAccuracy: numericAccuracy,
        capturedAt: captureDate,
        evidenceUploadedAt: new Date(),

        imageVerificationStatus,
        imagePredictedCategory,
        imageConfidence: confidence,
        evidenceReviewReason,

        isDuplicate,
        duplicateOf:
          duplicateOf ||
          (existingImage ? existingImage._id : null),

        duplicateSimilarity:
          Number(duplicateResult.similarity) || 0
      })

      return res.status(201).json({
        success: true,
        message:
          "Complaint created and image uploaded. Evidence status is available for review.",
        complaint
      })
    } catch (error) {
      console.error(
        "Complaint creation error:",
        error.message
      )

      if (uploadedImage?.public_id) {
        try {
          await cloudinary.uploader.destroy(
            uploadedImage.public_id,
            { resource_type: "image" }
          )
        } catch (cleanupError) {
          console.error(
            "Cloudinary cleanup error:",
            cleanupError.message
          )
        }
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to create the complaint. Please try again."
      })
    }
  }
)

router.get(
  "/my",
  protect,
  async (req, res) => {
    try {
      const complaints = await Complaint.find({
        userId: req.user.userId
      })
        .populate("resolvedBy", "name email")
        .sort({ createdAt: -1 })

      res.json({
        success: true,
        complaints
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

router.get(
  "/all",
  protect,
  requireAuthority,
  async (req, res) => {
    try {
      const complaints = await Complaint.find()
        .populate("userId", "name email")
        .populate("assignedTo", "name email")
        .populate("resolvedBy", "name email")
        .sort({ createdAt: -1 })

      res.json({
        success: true,
        complaints
      })
    } catch (error) {
      console.error(
        "Fetch all complaints error:",
        error.message
      )

      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

router.patch(
  "/:id/status",
  protect,
  requireAuthority,
  async (req, res) => {
    try {
      const { status } = req.body

      const allowedStatuses = [
        "Pending",
        "In Progress",
        "Reopened"
      ]

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Use the resolution endpoint to mark a complaint as resolved"
        })
      }

      const complaint = await Complaint.findByIdAndUpdate(
        req.params.id,
        { status },
        {
          returnDocument: "after",
          runValidators: true
        }
      )

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Complaint not found"
        })
      }

      res.json({
        success: true,
        message: "Complaint status updated",
        complaint
      })
    } catch (error) {
      console.error("Status update error:", error.message)

      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

router.patch(
  "/:id/assign",
  protect,
  requireAuthority,
  async (req, res) => {
    try {
      const { department, assignedTo } = req.body

      const allowedDepartments = [
        "Sanitation",
        "Public Works",
        "Water Supply",
        "Drainage",
        "Electrical",
        "General"
      ]

      if (
        department &&
        !allowedDepartments.includes(department)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid department"
        })
      }

      const updateData = {}

      if (department) {
        updateData.department = department
      }

      if (assignedTo) {
        updateData.assignedTo = assignedTo
      }

      const complaint = await Complaint.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true
        }
      ).populate("assignedTo", "name email")

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Complaint not found"
        })
      }

      res.json({
        success: true,
        message: "Complaint assignment updated",
        complaint
      })
    } catch (error) {
      console.error("Assignment error:", error.message)

      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

router.patch(
  "/:id/resolve",
  protect,
  requireAuthority,
  async (req, res) => {
    try {
      const {
        resolutionDescription,
        resolutionProof
      } = req.body

      if (
        typeof resolutionDescription !== "string" ||
        !resolutionDescription.trim() ||
        typeof resolutionProof !== "string" ||
        !resolutionProof.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Resolution description and proof URL are required"
        })
      }

      const complaint = await Complaint.findById(
        req.params.id
      )

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Complaint not found"
        })
      }

      if (complaint.status === "Resolved") {
        return res.status(400).json({
          success: false,
          message: "Complaint is already resolved"
        })
      }

      complaint.status = "Resolved"
      complaint.resolutionDescription =
        resolutionDescription.trim()
      complaint.resolutionProof = resolutionProof.trim()
      complaint.resolvedAt = new Date()
      complaint.resolvedBy = req.user.userId
      complaint.citizenVerification = "Pending"
      complaint.citizenVerificationMessage = ""

      await complaint.save({
        validateModifiedOnly: true
      })

      res.json({
        success: true,
        message: "Complaint marked as resolved",
        complaint
      })
    } catch (error) {
      console.error(
        "Complaint resolution error:",
        error.message
      )

      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

router.patch(
  "/:id/verify",
  protect,
  async (req, res) => {
    try {
      const { decision, message } = req.body

      if (!["Accepted", "Rejected"].includes(decision)) {
        return res.status(400).json({
          success: false,
          message: "Decision must be Accepted or Rejected"
        })
      }

      const complaint = await Complaint.findById(
        req.params.id
      )

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Complaint not found"
        })
      }

      if (
        complaint.userId.toString() !==
        req.user.userId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only verify your own complaint"
        })
      }

      if (complaint.status !== "Resolved") {
        return res.status(400).json({
          success: false,
          message:
            "Only resolved complaints can be verified"
        })
      }

      if (complaint.citizenVerification === "Accepted") {
        return res.status(400).json({
          success: false,
          message:
            "Complaint has already been verified"
        })
      }

      if (
        decision === "Rejected" &&
        (typeof message !== "string" || !message.trim())
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide a reason for reopening the complaint"
        })
      }

      complaint.citizenVerification = decision
      complaint.citizenVerificationMessage =
        typeof message === "string" ? message.trim() : ""

      if (decision === "Rejected") {
        complaint.status = "Reopened"
        complaint.reopenedAt = new Date()
        complaint.escalationReason = message.trim()
      }

      await complaint.save()

      res.json({
        success: true,
        message:
          decision === "Accepted"
            ? "Resolution accepted successfully"
            : "Complaint reopened successfully",
        complaint
      })
    } catch (error) {
      console.error(
        "Complaint verification error:",
        error.message
      )

      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

router.get(
  "/hotspots",
  protect,
  async (req, res) => {
    try {
      const complaints = await Complaint.find(
        {
          latitude: {
            $exists: true,
            $ne: null
          },
          longitude: {
            $exists: true,
            $ne: null
          }
        },
        {
          _id: 1,
          latitude: 1,
          longitude: 1
        }
      )

      if (complaints.length === 0) {
        return res.json({
          success: true,
          hotspots: [],
          message:
            "No complaints with location data found"
        })
      }

      const complaintData = complaints.map(
        (complaint) => ({
          id: complaint._id.toString(),
          latitude: complaint.latitude,
          longitude: complaint.longitude
        })
      )

      const result = await detectHotspots(
        complaintData,
        100,
        5
      )

      res.json(result)
    } catch (error) {
      console.error(
        "Hotspot detection error:",
        error.message
      )

      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

module.exports = router
