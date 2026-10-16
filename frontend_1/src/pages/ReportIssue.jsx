import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_GPS_ACCURACY = 150

function ReportIssue() {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const previewRef = useRef(null)

  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [severity, setSeverity] = useState("")

  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")

  const [cameraOpen, setCameraOpen] = useState(false)
  const [evidenceImage, setEvidenceImage] = useState(null)
  const [imagePreview, setImagePreview] = useState("")
  const [captureAccuracy, setCaptureAccuracy] = useState("")
  const [capturedAt, setCapturedAt] = useState("")

  const [locationMessage, setLocationMessage] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !streamRef.current) {
      return
    }

    videoRef.current.srcObject = streamRef.current

    videoRef.current.play().catch(() => {
      setLocationMessage("Unable to start the camera preview.")
    })
  }, [cameraOpen])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop()
        })
      }

      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
      }
    }
  }, [])

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })

      streamRef.current = null
    }

    setCameraOpen(false)
  }

  const startCamera = async () => {
    setMessage("")
    setLocationMessage("Requesting camera permission...")

    if (!navigator.mediaDevices?.getUserMedia) {
      setLocationMessage(
        "Camera access requires HTTPS or localhost and a supported browser."
      )
      return
    }

    try {
      stopCamera()

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" }
        }
      })

      streamRef.current = stream
      setCameraOpen(true)
      setLocationMessage(
        "Camera ready. Point it at the reported issue."
      )
    } catch {
      setLocationMessage(
        "Camera access failed. Allow camera permission and try again."
      )
    }
  }

  const captureEvidence = async () => {
    const video = videoRef.current

    if (!video || !video.videoWidth || !video.videoHeight) {
      setLocationMessage("Wait for the camera to become ready.")
      return
    }

    if (!navigator.geolocation) {
      setLocationMessage("GPS location is not supported by this browser.")
      return
    }

    setLoading(true)
    setLocationMessage("Getting a fresh GPS location...")

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 20000
          }
        )
      })

      const lat = position.coords.latitude
      const lng = position.coords.longitude
      const accuracy = position.coords.accuracy

      if (accuracy > MAX_GPS_ACCURACY) {
        setLocationMessage(
          `GPS accuracy is approximately ${Math.round(accuracy)} metres. We require ${MAX_GPS_ACCURACY} metres or better. Try again where the GPS signal is stronger.`
        )
        return
      }

      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const context = canvas.getContext("2d")

      if (!context) {
        setLocationMessage("Unable to capture the image.")
        return
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      })

      if (!blob) {
        setLocationMessage("Unable to create the captured image.")
        return
      }

      if (blob.size > MAX_FILE_SIZE) {
        setLocationMessage(
          "The image exceeds 5 MB. Please try capturing it again."
        )
        return
      }

      const file = new File(
        [blob],
        `evidence-${Date.now()}.jpg`,
        { type: "image/jpeg" }
      )

      const previewUrl = URL.createObjectURL(blob)

      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
      }

      previewRef.current = previewUrl

      setEvidenceImage(file)
      setImagePreview(previewUrl)
      setLatitude(String(lat))
      setLongitude(String(lng))
      setCaptureAccuracy(String(accuracy))
      setCapturedAt(new Date().toISOString())

      stopCamera()

      setLocationMessage(
        `Photo captured. GPS accuracy: approximately ${Math.round(accuracy)} metres.`
      )
    } catch (error) {
      setLocationMessage(
        error.code === 1
          ? "Location permission was denied. Allow location access to capture evidence."
          : "Unable to obtain a fresh GPS location. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  const retakePhoto = () => {
    setEvidenceImage(null)
    setImagePreview("")
    setCaptureAccuracy("")
    setCapturedAt("")
    setLatitude("")
    setLongitude("")
    setMessage("")
    setLocationMessage("Capture a new photo at the issue location.")

    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
      previewRef.current = null
    }

    startCamera()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("")

    if (!evidenceImage) {
      setMessage("Please capture a new issue photo before submitting.")
      return
    }

    if (!latitude || !longitude || !captureAccuracy || !capturedAt) {
      setMessage("Please capture the photo with a valid GPS location.")
      return
    }

    if (Number(captureAccuracy) > MAX_GPS_ACCURACY) {
      setMessage("GPS accuracy is insufficient. Please capture the evidence again.")
      return
    }

    try {
      setLoading(true)

      const token = localStorage.getItem("token")

      if (!token) {
        setMessage("Please log in before submitting a complaint.")
        return
      }

      const formData = new FormData()

      formData.append("description", description)
      formData.append("location", location)
      formData.append("severity", severity)
      formData.append("latitude", latitude)
      formData.append("longitude", longitude)
      formData.append("evidenceImage", evidenceImage)
      formData.append("captureAccuracy", captureAccuracy)
      formData.append("capturedAt", capturedAt)

      const response = await api.post(
        "/complaints",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      setMessage(response.data.message || "Complaint submitted successfully.")

      setDescription("")
      setLocation("")
      setSeverity("")
      setLatitude("")
      setLongitude("")
      setEvidenceImage(null)
      setImagePreview("")
      setCaptureAccuracy("")
      setCapturedAt("")

      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
        previewRef.current = null
      }

      setTimeout(() => {
        navigate("/complaints")
      }, 1000)
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Failed to submit complaint. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="report-page">
      <div className="report-page-heading">
        <div>
          <p className="eyebrow">DIGITAL NIVARAN - CITIZEN SERVICES</p>
          <h1>Report a civic issue</h1>
          <p className="report-intro">
            Share what happened and where it happened. Your report helps the
            responsible civic team understand the issue and take action.
          </p>
        </div>
        <div className="report-heading-note">
          <span className="report-note-icon">✓</span>
          <span><strong>Help us verify the issue</strong><small>A current photo and precise location are required.</small></span>
        </div>
      </div>

      <form className="report-form-card" onSubmit={handleSubmit}>
        <div className="report-form-top">
          <div>
            <span className="report-step">REPORT DETAILS</span>
            <h2>Tell us what needs attention</h2>
            <p>Fields marked with an asterisk are required.</p>
          </div>
          <span className="report-form-number">01 <span>/ 03</span></span>
        </div>

        <div className="report-form-grid">
          <div className="form-field report-field-wide">
            <label htmlFor="description">Issue description <span>*</span></label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem, its impact, and any useful details..."
              rows="5"
              required
            />
            <small>Be specific so the responsible team can understand the problem.</small>
          </div>

          <div className="form-field">
            <label htmlFor="location">Area or landmark <span>*</span></label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Surajpur Main Road, near..."
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="severity">Issue severity <span>*</span></label>
            <select
              id="severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              required
            >
              <option value="">Choose urgency</option>
              <option value="1">Low — minor inconvenience</option>
              <option value="2">Medium — needs attention</option>
              <option value="3">High — urgent public impact</option>
            </select>
          </div>
        </div>

        <section className="evidence-panel">
          <div className="evidence-heading">
            <div className="evidence-icon">▧</div>
            <div>
              <span className="report-step">PHOTO & LOCATION VERIFICATION</span>
              <h2>Attach on-site evidence</h2>
              <p>Capture a new photo from the issue location. Gallery uploads are not available.</p>
            </div>
          </div>

          {!cameraOpen && !evidenceImage && (
            <div className="camera-empty-state">
              <div className="camera-empty-icon">＋</div>
              <strong>No photo captured yet</strong>
              <p>Allow camera and location access when your browser asks.</p>
              <button className="button button-secondary" type="button" onClick={startCamera}>
                Open camera
              </button>
            </div>
          )}

          {cameraOpen && (
            <div className="camera-active">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />
              <div className="camera-actions">
                <button className="button button-primary" type="button" onClick={captureEvidence} disabled={loading}>
                  {loading ? "Capturing..." : "Capture photo"}
                </button>
                <button className="button button-secondary" type="button" onClick={stopCamera}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {imagePreview && (
            <div className="evidence-preview">
              <img src={imagePreview} alt="Captured issue evidence" />
              <div className="evidence-metadata">
                <span className="evidence-success">✓ Photo captured</span>
                <p><strong>Latitude</strong><span>{latitude}</span></p>
                <p><strong>Longitude</strong><span>{longitude}</span></p>
                <p><strong>GPS accuracy</strong><span>Approx. {Math.round(Number(captureAccuracy))} metres</span></p>
                <p><strong>Captured at</strong><span>{new Date(capturedAt).toLocaleString()}</span></p>
                <button className="button button-secondary" type="button" onClick={retakePhoto} disabled={loading}>
                  Retake photo
                </button>
              </div>
            </div>
          )}

          {locationMessage && <p className="inline-feedback" role="status">{locationMessage}</p>}
        </section>

        {message && <p className="form-message" role="status">{message}</p>}

        <div className="report-submit-row">
          <p><span>🔒</span> Your report details are submitted securely for review.</p>
          <button className="button button-primary report-submit-button" type="submit" disabled={loading || cameraOpen}>
            {loading ? "Processing report..." : "Submit complaint"} <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>
      <p className="report-help-text">Need to check an existing report? <a href="/complaints">View my complaints</a></p>
    </main>
  )
}

export default ReportIssue
