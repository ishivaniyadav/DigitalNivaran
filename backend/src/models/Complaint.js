
const mongoose = require("mongoose")

const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Garbage",
        "Road Damage",
        "Water",
        "Drainage",
        "Electricity",
        "Other"
      ]
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },

    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },

    severity: {
      type: Number,
      required: true,
      min: 1,
      max: 3
    },

    imageUrl: {
      type: String,
      required: true,
      trim: true
    },

    imagePublicId: {
      type: String,
      required: true,
      trim: true
    },

    imageHash: {
      type: String,
      required: true,
      index: true
    },

    captureAccuracy: {
      type: Number,
      required: true,
      min: 0
    },

    capturedAt: {
      type: Date,
      required: true
    },

    evidenceUploadedAt: {
      type: Date,
      default: Date.now
    },

    imageVerificationStatus: {
      type: String,
      enum: [
        "Pending",
        "Likely Supported",
        "Needs Review",
        "Mismatch",
        "Rejected"
      ],
      default: "Pending"
    },

    imagePredictedCategory: {
      type: String,
      default: "",
      trim: true
    },

    imageConfidence: {
      type: Number,
      default: null,
      min: 0,
      max: 1
    },

    evidenceReviewReason: {
      type: String,
      default: "Image uploaded; AI verification is pending.",
      trim: true
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },

    department: {
      type: String,
      enum: [
        "Sanitation",
        "Public Works",
        "Water Supply",
        "Drainage",
        "Electrical",
        "General"
      ],
      default: "General"
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    isDuplicate: {
      type: Boolean,
      default: false
    },

    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      default: null
    },

    duplicateSimilarity: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "In Progress",
        "Resolved",
        "Reopened"
      ],
      default: "Pending"
    },

    resolutionDescription: {
      type: String,
      default: "",
      trim: true
    },

    resolutionProof: {
      type: String,
      default: "",
      trim: true
    },

    resolvedAt: {
      type: Date,
      default: null
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    citizenVerification: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Rejected"
      ],
      default: "Pending"
    },

    citizenVerificationMessage: {
      type: String,
      default: "",
      trim: true
    },

    reopenedAt: {
      type: Date,
      default: null
    },

    escalationReason: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true
  }
)

const Complaint = mongoose.model(
  "Complaint",
  complaintSchema
)

module.exports = Complaint