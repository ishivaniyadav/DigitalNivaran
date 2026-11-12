
require("dotenv").config()

const connectDB = require("./config/db")
const app = require("./app")

const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    await connectDB()

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error("Failed to start backend:", error.message)
    process.exit(1)
  }
}

startServer()
