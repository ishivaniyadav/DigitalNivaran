
const axios = require("axios")
const FormData = require("form-data")

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "http://localhost:8000"

const predictCategory = async (description) => {
  const response = await axios.post(
    `${ML_SERVICE_URL}/predict/category`,
    { description }
  )

  return response.data.category
}

const predictPriority = async (
  category,
  severity,
  repeatedReports,
  locationSensitivity
) => {
  const response = await axios.post(
    `${ML_SERVICE_URL}/predict/priority`,
    {
      category,
      severity,
      repeated_reports: repeatedReports,
      location_sensitivity: locationSensitivity
    }
  )

  return response.data.priority
}

const checkDuplicate = async (
  description,
  existingDescriptions
) => {
  const response = await axios.post(
    `${ML_SERVICE_URL}/predict/duplicate`,
    {
      description,
      existing_descriptions: existingDescriptions
    }
  )

  return response.data
}

const detectHotspots = async (
  complaints,
  epsMeters = 100,
  minSamples = 5
) => {
  const response = await axios.post(
    `${ML_SERVICE_URL}/predict/hotspots`,
    {
      complaints,
      eps_meters: epsMeters,
      min_samples: minSamples
    }
  )

  return response.data
}

const verifyImageEvidence = async (
  imageBuffer,
  mimeType,
  description,
  category
) => {
  const form = new FormData()

  form.append("image", imageBuffer, {
    filename: "evidence",
    contentType: mimeType
  })

  form.append("description", description)
  form.append("category", category)

  const response = await axios.post(
    `${ML_SERVICE_URL}/verify/image`,
    form,
    {
      headers: form.getHeaders(),
      timeout: 60000,
      maxBodyLength: 6 * 1024 * 1024
    }
  )

  return response.data
}

module.exports = {
  predictCategory,
  predictPriority,
  checkDuplicate,
  detectHotspots,
  verifyImageEvidence
}
