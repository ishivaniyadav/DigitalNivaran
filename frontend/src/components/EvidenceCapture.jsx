import { useEffect, useRef, useState } from "react"

const MAX_FILE_SIZE = 5 * 1024 * 1024

function EvidenceCapture({ onCapture }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [cameraOpen, setCameraOpen] = useState(false)
  const [imagePreview, setImagePreview] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [evidence, setEvidence] = useState(null)

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })

      streamRef.current = null
    }

    setCameraOpen(false)
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop()
        })
      }

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const startCamera = async () => {
    setMessage("")

    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(
        "Camera access is unavailable. Use HTTPS or localhost in a supported browser."
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
      setMessage("Camera ready. Position the issue inside the frame.")

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      setMessage(
        "Camera access failed. Please allow camera permission and try again."
      )
    }
  }

  const captureEvidence = async () => {
    const video = videoRef.current

    if (!video || !video.videoWidth || !video.videoHeight) {
      setMessage("The camera is not ready. Please try again.")
      return
    }

    if (!navigator.geolocation) {
      setMessage("GPS location is not supported by this browser.")
      return
    }

    setLoading(true)
    setMessage("Checking your current location...")

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

      const latitude = position.coords.latitude
      const longitude = position.coords.longitude
      const accuracy = position.coords.accuracy

      if (accuracy > 150) {
        setMessage(
          `GPS accuracy is approximately ${Math.round(accuracy)} metres. Move to an area with a better GPS signal and try again.`
        )
        return
      }

      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const context = canvas.getContext("2d")

      if (!context) {
        setMessage("Unable to capture the image. Please try again.")
        return
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      })

      if (!blob) {
        setMessage("Unable to create the image. Please try again.")
        return
      }

      if (blob.size > MAX_FILE_SIZE) {
        setMessage(
          "The captured image exceeds 5 MB. Move closer to the issue or try again."
        )
        return
      }

      const file = new File(
        [blob],
        `evidence-${Date.now()}.jpg`,
        { type: "image/jpeg" }
      )

      const capturedAt = new Date().toISOString()
      const previewUrl = URL.createObjectURL(blob)

      setImagePreview((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return previewUrl
      })

      const capturedEvidence = {
        file,
        latitude,
        longitude,
        accuracy,
        capturedAt
      }

      setEvidence(capturedEvidence)
      onCapture?.(capturedEvidence)
      stopCamera()

      setMessage(
        `Photo captured. GPS accuracy: approximately ${Math.round(accuracy)} metres.`
      )
    } catch (error) {
      setMessage(
        error.code === 1
          ? "Location permission was denied. Allow location access to capture evidence."
          : "Unable to obtain a fresh GPS location. Please try again outdoors."
      )
    } finally {
      setLoading(false)
    }
  }

  const retakePhoto = () => {
    setEvidence(null)
    setImagePreview((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return ""
    })
    onCapture?.(null)
    setMessage("")
    startCamera()
  }

  return (
    <section>
      <h2>Issue Photo Evidence</h2>

      <p>
        Capture a new photo using the camera at the reported location.
        Gallery uploads are not available.
      </p>

      {!cameraOpen && !evidence && (
        <button type="button" onClick={startCamera}>
          Open Camera
        </button>
      )}

      {cameraOpen && (
        <div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              display: "block",
              width: "100%",
              maxWidth: "500px",
              background: "#111",
              borderRadius: "8px"
            }}
          />

          <button
            type="button"
            onClick={captureEvidence}
            disabled={loading}
          >
            {loading ? "Capturing..." : "Capture Photo"}
          </button>

          <button type="button" onClick={stopCamera}>
            Cancel Camera
          </button>
        </div>
      )}

      {imagePreview && (
        <div>
          <h3>Captured Evidence</h3>

          <img
            src={imagePreview}
            alt="Captured issue evidence"
            style={{
              display: "block",
              width: "100%",
              maxWidth: "500px",
              borderRadius: "8px"
            }}
          />

          {evidence && (
            <div>
              <p>
                Latitude: {evidence.latitude}
              </p>

              <p>
                Longitude: {evidence.longitude}
              </p>

              <p>
                GPS accuracy: approximately{" "}
                {Math.round(evidence.accuracy)} metres
              </p>

              <p>
                Capture time: {evidence.capturedAt}
              </p>
            </div>
          )}

          <button type="button" onClick={retakePhoto}>
            Retake Photo
          </button>
        </div>
      )}

      {message && <p role="status">{message}</p>}
    </section>
  )
}

export default EvidenceCapture
