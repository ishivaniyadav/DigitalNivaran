const axios = require("axios")


const predictCategory = async (description) => {
  const response = await axios.post(
    "http://localhost:8000/predict/category",
    {
      description
    }
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
    "http://localhost:8000/predict/priority",
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
    "http://localhost:8000/predict/duplicate",
    {
      description,
      existing_descriptions: existingDescriptions
    }
  )

  return response.data
}


module.exports = {
  predictCategory,
  predictPriority,
  checkDuplicate
}