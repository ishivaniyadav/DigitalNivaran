const mongoose = require("mongoose")
require("dotenv").config()

const connectDB = require("./config/db")
const User = require("./models/User")
const Complaint = require("./models/Complaint")


const complaints = [
  {
    description: "SEED: Garbage is overflowing near the main community gate and has not been collected for several days.",
    category: "Garbage",
    location: "Surajpur Main Gate",
    latitude: 28.45610,
    longitude: 77.51210,
    severity: 3,
    priority: "High",
    department: "Sanitation",
    status: "Pending"
  },
  {
    description: "SEED: Large garbage pile has accumulated beside the residential road and is causing a bad smell.",
    category: "Garbage",
    location: "Surajpur Residential Road",
    latitude: 28.45620,
    longitude: 77.51220,
    severity: 3,
    priority: "High",
    department: "Sanitation",
    status: "In Progress"
  },
  {
    description: "SEED: Waste bins are overflowing near the market and waste has spread onto the road.",
    category: "Garbage",
    location: "Surajpur Market",
    latitude: 28.45630,
    longitude: 77.51215,
    severity: 2,
    priority: "Medium",
    department: "Sanitation",
    status: "Pending"
  },
  {
    description: "SEED: Uncollected household waste is creating an unhygienic area near the bus stop.",
    category: "Garbage",
    location: "Surajpur Bus Stop",
    latitude: 28.45625,
    longitude: 77.51230,
    severity: 2,
    priority: "Medium",
    department: "Sanitation",
    status: "Resolved"
  },
  {
    description: "SEED: Garbage has been dumped beside the drainage channel and is blocking access for cleaning.",
    category: "Garbage",
    location: "Surajpur Drain Road",
    latitude: 28.45615,
    longitude: 77.51225,
    severity: 3,
    priority: "High",
    department: "Sanitation",
    status: "Resolved"
  },
  {
    description: "SEED: A deep pothole has developed in the middle of the road and is dangerous for two-wheelers.",
    category: "Road Damage",
    location: "Surajpur Road",
    latitude: 28.45780,
    longitude: 77.51390,
    severity: 3,
    priority: "High",
    department: "Public Works",
    status: "Pending"
  },
  {
    description: "SEED: Several cracks and damaged sections are visible on the road near the school.",
    category: "Road Damage",
    location: "School Road, Surajpur",
    latitude: 28.45910,
    longitude: 77.51520,
    severity: 2,
    priority: "Medium",
    department: "Public Works",
    status: "In Progress"
  },
  {
    description: "SEED: Road surface has broken near the intersection and vehicles are having difficulty passing.",
    category: "Road Damage",
    location: "Surajpur Intersection",
    latitude: 28.46100,
    longitude: 77.51640,
    severity: 2,
    priority: "Medium",
    department: "Public Works",
    status: "Resolved"
  },
  {
    description: "SEED: Water is leaking continuously from a damaged pipeline beside the residential lane.",
    category: "Water",
    location: "Surajpur Residential Lane",
    latitude: 28.46220,
    longitude: 77.51710,
    severity: 3,
    priority: "High",
    department: "Water Supply",
    status: "Pending"
  },
  {
    description: "SEED: Clean water is being wasted because of a leaking public water connection.",
    category: "Water",
    location: "Surajpur Sector Road",
    latitude: 28.46310,
    longitude: 77.51800,
    severity: 2,
    priority: "Medium",
    department: "Water Supply",
    status: "In Progress"
  },
  {
    description: "SEED: Drain is blocked and dirty water has started collecting outside nearby houses.",
    category: "Drainage",
    location: "Surajpur Housing Area",
    latitude: 28.46400,
    longitude: 77.51910,
    severity: 3,
    priority: "High",
    department: "Drainage",
    status: "Pending"
  },
  {
    description: "SEED: Drainage overflow has caused waterlogging near the street corner after rainfall.",
    category: "Drainage",
    location: "Surajpur Street Corner",
    latitude: 28.46520,
    longitude: 77.52000,
    severity: 3,
    priority: "High",
    department: "Drainage",
    status: "Resolved"
  },
  {
    description: "SEED: Streetlight is not working near the pedestrian crossing, making the area poorly lit at night.",
    category: "Electricity",
    location: "Surajpur Pedestrian Crossing",
    latitude: 28.46610,
    longitude: 77.52120,
    severity: 2,
    priority: "Medium",
    department: "Electrical",
    status: "Pending"
  },
  {
    description: "SEED: Two streetlights have stopped working along the main road.",
    category: "Electricity",
    location: "Surajpur Main Road",
    latitude: 28.46700,
    longitude: 77.52200,
    severity: 2,
    priority: "Medium",
    department: "Electrical",
    status: "In Progress"
  },
  {
    description: "SEED: Damaged electrical streetlight pole has been reported near the park entrance.",
    category: "Electricity",
    location: "Surajpur Park",
    latitude: 28.46810,
    longitude: 77.52300,
    severity: 3,
    priority: "High",
    department: "Electrical",
    status: "Resolved"
  },
  {
    description: "SEED: Public footpath is damaged and tiles are missing near the community centre.",
    category: "Other",
    location: "Surajpur Community Centre",
    latitude: 28.46900,
    longitude: 77.52410,
    severity: 1,
    priority: "Low",
    department: "General",
    status: "Pending"
  },
  {
    description: "SEED: Roadside signboard has fallen and is obstructing part of the pedestrian path.",
    category: "Other",
    location: "Surajpur Service Road",
    latitude: 28.47010,
    longitude: 77.52500,
    severity: 2,
    priority: "Medium",
    department: "General",
    status: "Resolved"
  },
  {
    description: "SEED: The same overflowing garbage problem has been reported again near the main community gate.",
    category: "Garbage",
    location: "Surajpur Main Gate",
    latitude: 28.45612,
    longitude: 77.51212,
    severity: 3,
    priority: "High",
    department: "Sanitation",
    status: "Reopened"
  },
  {
    description: "SEED: Another report has been submitted for the garbage pile beside the residential road.",
    category: "Garbage",
    location: "Surajpur Residential Road",
    latitude: 28.45622,
    longitude: 77.51222,
    severity: 2,
    priority: "Medium",
    department: "Sanitation",
    status: "Pending"
  },
  {
    description: "SEED: A small damaged road section has been noticed near the local park.",
    category: "Road Damage",
    location: "Surajpur Park Road",
    latitude: 28.47120,
    longitude: 77.52610,
    severity: 1,
    priority: "Low",
    department: "Public Works",
    status: "Pending"
  }
]


const seedComplaints = async () => {
  try {
    await connectDB()

    const citizen = await User.findOne({
      role: "citizen"
    }).sort({
      createdAt: 1
    })

    if (!citizen) {
      console.log("No citizen user found.")
      console.log(
        "Register a citizen account first, then run the seed again."
      )

      process.exit(1)
    }

    await Complaint.deleteMany({
      description: {
        $regex: "^SEED:"
      }
    })

    const createdComplaints = []

    for (const data of complaints) {
      const complaint = await Complaint.create({
        ...data,

        userId: citizen._id,

        isDuplicate: false,

        duplicateOf: null,

        duplicateSimilarity: 0
      })

      createdComplaints.push(complaint)
    }

    const duplicateA = createdComplaints[0]
    const duplicateB = createdComplaints[17]

    duplicateB.isDuplicate = true
    duplicateB.duplicateOf = duplicateA._id
    duplicateB.duplicateSimilarity = 0.88

    await duplicateB.save()


    const duplicateC = createdComplaints[1]
    const duplicateD = createdComplaints[18]

    duplicateD.isDuplicate = true
    duplicateD.duplicateOf = duplicateC._id
    duplicateD.duplicateSimilarity = 0.82

    await duplicateD.save()


    console.log("")
    console.log("====================================")
    console.log("SEED DATA INSERTED SUCCESSFULLY")
    console.log("====================================")
    console.log("")
    console.log(`Citizen used: ${citizen.email}`)
    console.log(
      `Complaints inserted: ${createdComplaints.length}`
    )

    console.log("")
    console.log(
      "Seed records can be recreated safely."
    )

    console.log(
      "Previous records starting with SEED: were removed first."
    )

    console.log("")
    console.log("Now test:")
    console.log("1. Authority Dashboard")
    console.log("2. Analytics")
    console.log("3. Complaint Map")
    console.log("4. DBSCAN Hotspots")
    console.log("5. Duplicate Detection")
    console.log("")


    await mongoose.connection.close()

    process.exit(0)

  } catch (error) {
    console.error(
      "Seed failed:",
      error.message
    )

    await mongoose.connection.close()

    process.exit(1)
  }
}


seedComplaints()