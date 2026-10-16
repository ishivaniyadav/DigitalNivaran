import { useEffect, useState } from "react"
import api from "../services/api"

function MyComplaints() {
  const [complaints, setComplaints] = useState([])
  const [message, setMessage] = useState("Loading...")

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token")

      const response = await api.get("/complaints/my", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const complaintList = response.data.complaints || []
      setComplaints(complaintList)

      setMessage(
        complaintList.length === 0
          ? "No complaints submitted yet."
          : ""
      )
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Failed to load complaints"
      )
    }
  }

  useEffect(() => {
    fetchComplaints()
  }, [])

  const verifyResolution = async (
    complaintId,
    decision,
    verificationMessage = ""
  ) => {
    try {
      const token = localStorage.getItem("token")

      await api.patch(
        `/complaints/${complaintId}/verify`,
        {
          decision,
          message: verificationMessage
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      setMessage(
        decision === "Accepted"
          ? "Resolution accepted successfully."
          : "Complaint reopened successfully."
      )

      await fetchComplaints()
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Failed to verify resolution"
      )
    }
  }

  const handleReopen = async (complaintId) => {
    const reason = window.prompt(
      "Why are you reopening this complaint?"
    )

    if (!reason || !reason.trim()) {
      return
    }

    await verifyResolution(
      complaintId,
      "Rejected",
      reason.trim()
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            My Complaints
          </h1>
          <p className="mt-2 text-gray-600">
            Track your reported civic issues and view their evidence and resolution updates.
          </p>
        </div>

        {message && (
          <p
            role="status"
            className="mb-6 rounded-lg border border-gray-200 bg-white p-4 text-gray-700"
          >
            {message}
          </p>
        )}

        <div className="space-y-6">
          {complaints.map((complaint) => (
            <article
              key={complaint._id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
                <div className="bg-gray-100">
                  {complaint.imageUrl ? (
                    <a
                      href={complaint.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open complaint evidence image in a new tab"
                    >
                      <img
                        src={complaint.imageUrl}
                        alt={`Evidence for ${complaint.category} complaint`}
                        className="h-20 w-full object-cover sm:h-24 md:h-26"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none"
                        }}
                      />
                    </a>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-gray-500 md:h-full md:min-h-72">
                      No evidence image available
                    </div>
                  )}
                </div>

                <div className="p-5 sm:p-6">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {complaint.category}
                    </h2>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                      {complaint.status}
                    </span>
                  </div>

                  <p className="mb-5 whitespace-pre-wrap text-gray-700">
                    {complaint.description}
                  </p>

                  <div className="space-y-3 text-sm text-gray-700">
                    <p>
                      <strong>Location:</strong>{" "}
                      {complaint.location}
                    </p>

                    <p>
                      <strong>Priority:</strong>{" "}
                      {complaint.priority}
                    </p>

                    <p>
                      <strong>Severity:</strong>{" "}
                      {complaint.severity}
                    </p>

                    {complaint.createdAt && (
                      <p>
                        <strong>Reported on:</strong>{" "}
                        {new Date(
                          complaint.createdAt
                        ).toLocaleString()}
                      </p>
                    )}

                    {complaint.captureAccuracy != null && (
                      <p>
                        <strong>Reported GPS accuracy:</strong>{" "}
                        {Math.round(
                          complaint.captureAccuracy
                        )} metres
                      </p>
                    )}

                    {complaint.imageVerificationStatus && (
                      <p>
                        <strong>Evidence review:</strong>{" "}
                        {complaint.imageVerificationStatus}
                      </p>
                    )}

                    {complaint.imagePredictedCategory && (
                      <p>
                        <strong>Image-predicted category:</strong>{" "}
                        {complaint.imagePredictedCategory}
                      </p>
                    )}

                    {complaint.isDuplicate && (
                      <p className="font-medium text-amber-700">
                        Possible duplicate complaint detected.
                      </p>
                    )}
                  </div>

                  {complaint.status === "Resolved" && (
                    <section className="mt-6 border-t border-gray-200 pt-5">
                      <h3 className="mb-3 text-lg font-semibold text-gray-900">
                        Resolution Details
                      </h3>

                      <p className="mb-3 text-sm text-gray-700">
                        <strong>Resolution:</strong>{" "}
                        {complaint.resolutionDescription ||
                          "No resolution description provided."}
                      </p>

                      {complaint.resolvedAt && (
                        <p className="mb-3 text-sm text-gray-700">
                          <strong>Resolved at:</strong>{" "}
                          {new Date(
                            complaint.resolvedAt
                          ).toLocaleString()}
                        </p>
                      )}

                      {complaint.resolvedBy && (
                        <p className="mb-3 text-sm text-gray-700">
                          <strong>Resolved by:</strong>{" "}
                          {complaint.resolvedBy.name ||
                            "Authority"}
                        </p>
                      )}

                      {complaint.resolutionProof && (
                        <a
                          href={complaint.resolutionProof}
                          target="_blank"
                          rel="noreferrer"
                          className="mb-4 inline-block font-medium text-blue-700 underline"
                        >
                          View Resolution Proof
                        </a>
                      )}

                      <p className="mb-4 text-sm text-gray-700">
                        <strong>Your verification:</strong>{" "}
                        {complaint.citizenVerification}
                      </p>

                      {complaint.citizenVerification ===
                        "Pending" && (
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() =>
                              verifyResolution(
                                complaint._id,
                                "Accepted"
                              )
                            }
                            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
                          >
                            Issue Resolved
                          </button>

                          <button
                            onClick={() =>
                              handleReopen(complaint._id)
                            }
                            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
                          >
                            Issue Not Resolved
                          </button>
                        </div>
                      )}

                      {complaint.citizenVerificationMessage && (
                        <p className="mt-3 text-sm text-gray-600">
                          <strong>Verification note:</strong>{" "}
                          {complaint.citizenVerificationMessage}
                        </p>
                      )}
                    </section>
                  )}

                  {complaint.status === "Reopened" && (
                    <section className="mt-5 rounded-lg bg-red-50 p-4">
                      <h3 className="font-semibold text-red-800">
                        Complaint Reopened
                      </h3>
                      <p className="mt-1 text-sm text-red-700">
                        <strong>Reason:</strong>{" "}
                        {complaint.escalationReason ||
                          "No reason provided."}
                      </p>
                    </section>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}

export default MyComplaints
