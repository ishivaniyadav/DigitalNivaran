// const express = require("express")

// const Complaint = require("../models/Complaint")
// const protect = require("../middleware/authMiddleware")
// const requireAuthority = require("../middleware/roleMiddleware")


// const router = express.Router()


// router.get(
//   "/",
//   protect,
//   requireAuthority,
//   async (req, res) => {
//     try {
//       const complaints =
//         await Complaint.find(
//           {},
//           {
//             category: 1,
//             status: 1,
//             priority: 1,
//             createdAt: 1,
//             citizenVerification: 1
//           }
//         ).sort({
//           createdAt: 1
//         })


//       const total =
//         complaints.length


//       const pending =
//         complaints.filter(
//           complaint =>
//             complaint.status ===
//             "Pending"
//         ).length


//       const inProgress =
//         complaints.filter(
//           complaint =>
//             complaint.status ===
//             "In Progress"
//         ).length


//       const resolved =
//         complaints.filter(
//           complaint =>
//             complaint.status ===
//             "Resolved"
//         ).length


//       const reopened =
//         complaints.filter(
//           complaint =>
//             complaint.status ===
//             "Reopened"
//         ).length


//       const highPriority =
//         complaints.filter(
//           complaint =>
//             complaint.priority ===
//             "High"
//         ).length


//       const mediumPriority =
//         complaints.filter(
//           complaint =>
//             complaint.priority ===
//             "Medium"
//         ).length


//       const lowPriority =
//         complaints.filter(
//           complaint =>
//             complaint.priority ===
//             "Low"
//         ).length


//       const verified =
//         complaints.filter(
//           complaint =>
//             complaint.citizenVerification ===
//             "Accepted"
//         ).length


//       const rejected =
//         complaints.filter(
//           complaint =>
//             complaint.citizenVerification ===
//             "Rejected"
//         ).length


//       const categoryNames = [
//         "Garbage",
//         "Road Damage",
//         "Water",
//         "Drainage",
//         "Electricity",
//         "Other"
//       ]


//       const categoryDistribution =
//         categoryNames.map(
//           category => ({
//             category,

//             count:
//               complaints.filter(
//                 complaint =>
//                   complaint.category ===
//                   category
//               ).length
//           })
//         )


//       const statusNames = [
//         "Pending",
//         "In Progress",
//         "Resolved",
//         "Reopened"
//       ]


//       const statusDistribution =
//         statusNames.map(
//           status => ({
//             status,

//             count:
//               complaints.filter(
//                 complaint =>
//                   complaint.status ===
//                   status
//               ).length
//           })
//         )


//       const priorityDistribution = [
//         {
//           priority: "High",
//           count: highPriority
//         },
//         {
//           priority: "Medium",
//           count: mediumPriority
//         },
//         {
//           priority: "Low",
//           count: lowPriority
//         }
//       ]


//       const monthlyData = {}


//       complaints.forEach(
//         complaint => {
//           const date =
//             new Date(
//               complaint.createdAt
//             )


//           const year =
//             date.getFullYear()


//           const month =
//             String(
//               date.getMonth() + 1
//             ).padStart(2, "0")


//           const key =
//             `${year}-${month}`


//           if (!monthlyData[key]) {
//             monthlyData[key] = {
//               month: key,
//               complaints: 0
//             }
//           }


//           monthlyData[key].complaints++
//         }
//       )


//       const monthlyTrend =
//         Object.values(
//           monthlyData
//         )


//       const resolutionRate =
//         total === 0
//           ? 0
//           : Number(
//               (
//                 (resolved / total) *
//                 100
//               ).toFixed(2)
//             )


//       const verificationRate =
//         resolved === 0
//           ? 0
//           : Number(
//               (
//                 (verified / resolved) *
//                 100
//               ).toFixed(2)
//             )


//       res.json({
//         success: true,

//         summary: {
//           total,
//           pending,
//           inProgress,
//           resolved,
//           reopened,
//           highPriority,
//           resolutionRate,
//           verified,
//           rejected,
//           verificationRate
//         },

//         categoryDistribution,

//         statusDistribution,

//         priorityDistribution,

//         monthlyTrend
//       })

//     } catch (error) {
//       console.error(
//         "Analytics error:",
//         error.message
//       )

//       res.status(500).json({
//         success: false,
//         message: error.message
//       })
//     }
//   }
// )


// module.exports = router


const express = require("express")

const Complaint = require("../models/Complaint")
const protect = require("../middleware/authMiddleware")
const requireAuthority = require("../middleware/roleMiddleware")

const router = express.Router()

const CATEGORIES = [
  "Garbage",
  "Road Damage",
  "Water",
  "Drainage",
  "Electricity",
  "Other"
]

const STATUSES = [
  "Pending",
  "In Progress",
  "Resolved",
  "Reopened"
]

const PRIORITIES = ["High", "Medium", "Low"]

const DEPARTMENTS = [
  "Sanitation",
  "Public Works",
  "Water Supply",
  "Drainage",
  "Electrical",
  "General"
]

router.get("/", protect, requireAuthority, async (req, res) => {
  try {
    const complaints = await Complaint.find({})
      .select(
        "category status priority department createdAt resolvedAt citizenVerification severity isDuplicate"
      )
      .sort({ createdAt: -1 })
      .lean()

    const total = complaints.length
    const countBy = (field, value) =>
      complaints.filter(item => item[field] === value).length

    const pending = countBy("status", "Pending")
    const inProgress = countBy("status", "In Progress")
    const resolved = countBy("status", "Resolved")
    const reopened = countBy("status", "Reopened")

    const highPriority = countBy("priority", "High")
    const unresolvedHighPriority = complaints.filter(
      item => item.priority === "High" && item.status !== "Resolved"
    ).length

    const verified = countBy("citizenVerification", "Accepted")
    const rejected = countBy("citizenVerification", "Rejected")
    const verificationPending = complaints.filter(
      item =>
        item.status === "Resolved" &&
        (!item.citizenVerification ||
          item.citizenVerification === "Pending")
    ).length

    const resolutionDurations = complaints
      .filter(
        item =>
          item.status === "Resolved" &&
          item.createdAt &&
          item.resolvedAt &&
          new Date(item.resolvedAt) >= new Date(item.createdAt)
      )
      .map(
        item =>
          (new Date(item.resolvedAt) - new Date(item.createdAt)) /
          (1000 * 60 * 60)
      )

    const averageResolutionHours =
      resolutionDurations.length > 0
        ? Number(
            (
              resolutionDurations.reduce((sum, hours) => sum + hours, 0) /
              resolutionDurations.length
            ).toFixed(1)
          )
        : null

    const categoryDistribution = CATEGORIES.map(category => ({
      category,
      count: countBy("category", category)
    }))

    const statusDistribution = STATUSES.map(status => ({
      status,
      count: countBy("status", status)
    }))

    const priorityDistribution = PRIORITIES.map(priority => ({
      priority,
      count: countBy("priority", priority)
    }))

    const departmentDistribution = DEPARTMENTS.map(department => {
      const assigned = complaints.filter(
        item => (item.department || "General") === department
      )

      return {
        department,
        total: assigned.length,
        open: assigned.filter(item => item.status !== "Resolved").length,
        resolved: assigned.filter(item => item.status === "Resolved").length
      }
    })

    const now = new Date()
    const monthlyTrend = []

    for (let offset = 5; offset >= 0; offset--) {
      const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() - offset,
        1
      )

      const year = monthDate.getFullYear()
      const monthNumber = String(monthDate.getMonth() + 1).padStart(2, "0")
      const key = `${year}-${monthNumber}`

      const count = complaints.filter(item => {
        if (!item.createdAt) return false
        const date = new Date(item.createdAt)

        return (
          date.getFullYear() === year &&
          date.getMonth() === monthDate.getMonth()
        )
      }).length

      monthlyTrend.push({
        month: key,
        label: monthDate.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit"
        }),
        complaints: count
      })
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const openOverSevenDays = complaints.filter(
      item =>
        item.status !== "Resolved" &&
        item.createdAt &&
        new Date(item.createdAt) < sevenDaysAgo
    ).length

    const duplicateCount = countBy("isDuplicate", true)

    res.json({
      success: true,
      summary: {
        total,
        pending,
        inProgress,
        resolved,
        reopened,
        highPriority,
        unresolvedHighPriority,
        resolutionRate:
          total === 0 ? 0 : Number(((resolved / total) * 100).toFixed(1)),
        verified,
        rejected,
        verificationPending,
        verificationRate:
          resolved === 0
            ? 0
            : Number(((verified / resolved) * 100).toFixed(1)),
        averageResolutionHours,
        resolutionSamples: resolutionDurations.length,
        openOverSevenDays,
        duplicateCount
      },
      categoryDistribution,
      statusDistribution,
      priorityDistribution,
      departmentDistribution,
      monthlyTrend
    })
  } catch (error) {
    console.error("Analytics error:", error)

    res.status(500).json({
      success: false,
      message: "Unable to calculate complaint analytics."
    })
  }
})

module.exports = router
