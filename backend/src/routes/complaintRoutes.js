const express = require("express")

const Complaint = require("../models/Complaint")
const protect = require("../middleware/authMiddleware")

const {
  predictCategory,
  predictPriority,
  checkDuplicate
} = require("../services/mlService")


const router = express.Router()


router.post("/", protect, async (req, res) => {
  try {
    const {
      description,
      location,
      severity
    } = req.body


    if (
      !description ||
      !location ||
      !severity
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Description, location and severity are required"
      })
    }


    const predictedCategory =
      await predictCategory(description)


    const previousComplaints =
      await Complaint.find(
        {},
        {
          description: 1
        }
      ).sort({
        createdAt: -1
      })


    const existingDescriptions =
      previousComplaints.map(
        complaint => complaint.description
      )


    const duplicateResult =
      await checkDuplicate(
        description,
        existingDescriptions
      )


    const predictedPriority =
      await predictPriority(
        predictedCategory,
        Number(severity),
        1,
        0
      )


    let duplicateOf = null


    if (
      duplicateResult.is_duplicate &&
      duplicateResult.matched_index !== null
    ) {
      duplicateOf =
        previousComplaints[
          duplicateResult.matched_index
        ]._id
    }


    const complaint = await Complaint.create({
      userId: req.user.userId,

      description,

      category: predictedCategory,

      location,

      severity: Number(severity),

      priority: predictedPriority,

      isDuplicate:
        duplicateResult.is_duplicate,

      duplicateOf,

      duplicateSimilarity:
        duplicateResult.similarity
    })


    res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      complaint
    })

  } catch (error) {
    console.error(
      "Complaint creation error:",
      error.message
    )

    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})


router.get("/my", protect, async (req, res) => {
  try {
    const complaints =
      await Complaint.find({
        userId: req.user.userId
      }).sort({
        createdAt: -1
      })


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
})


module.exports = router