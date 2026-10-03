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

    severity: {
      type: Number,
      required: true,
      min: 1,
      max: 3
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
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