const express = require("express")
const cors = require("cors")
require("dotenv").config()

const connectDB = require("./config/db")
const Complaint = require("./models/Complaint")
const authRoutes = require("./routes/authRoutes")
const protect = require("./middleware/authMiddleware")
const complaintRoutes = require("./routes/complaintRoutes")

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/complaints", complaintRoutes)

app.get("/api/complaints", protect, async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 })

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

app.post("/api/complaints", async (req, res) => {
  try {
    const complaint = await Complaint.create(req.body)

    res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      complaint
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

const PORT = process.env.PORT || 5000

connectDB()

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})