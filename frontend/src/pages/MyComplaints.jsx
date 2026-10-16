import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Search, Sparkles, FileText, Clock3, CircleCheck, ClipboardCheck, MapPin, ArrowUpRight } from "lucide-react"
import api from "../services/api"

const formatDate = value => value
  ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  : "Date unavailable"

function ComplaintTimeline({ status }) {
  const activeIndex = status === "Resolved" ? 2 : status === "In Progress" || status === "Reopened" ? 1 : 0
  const steps = ["Submitted", "In progress", "Resolved"]

  return (
    <div className={`citizen-timeline ${status === "Reopened" ? "is-reopened" : ""}`} aria-label={`Case progress: ${status}`}>
      {steps.map((step, index) => (
        <div className={`citizen-timeline-step ${index < activeIndex ? "is-done" : ""} ${index === activeIndex ? "is-current" : ""}`} key={step}>
          <span className="citizen-timeline-dot">{index < activeIndex ? "✓" : index + 1}</span>
          <span className="citizen-timeline-label">{step}</span>
        </div>
      ))}
    </div>
  )
}

function MyComplaints() {
  const [complaints, setComplaints] = useState([])
  const [message, setMessage] = useState("Loading...")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [sortOrder, setSortOrder] = useState("newest")

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

  const filteredComplaints = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matching = complaints.filter((complaint) => {
      const matchesStatus = statusFilter === "All" || complaint.status === statusFilter
      const searchable = [complaint.description, complaint.location, complaint.category, complaint.department]
        .filter(Boolean).join(" ").toLowerCase()
      return matchesStatus && (!query || searchable.includes(query))
    })
    return matching.sort((a, b) => sortOrder === "oldest"
      ? new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      : new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }, [complaints, search, statusFilter, sortOrder])

  const resolvedCount = complaints.filter((complaint) => complaint.status === "Resolved").length
  const activeCount = complaints.filter((complaint) => complaint.status !== "Resolved").length
  const aiSignalCount = complaints.filter((complaint) => complaint.imagePredictedCategory || complaint.isDuplicate).length
  const reviewCount = complaints.filter((complaint) => complaint.status === "Resolved" && complaint.citizenVerification === "Pending").length
  const categoryStats = useMemo(() => {
    const counts = complaints.reduce((result, complaint) => {
      const category = complaint.category || "Uncategorized"
      result[category] = (result[category] || 0) + 1
      return result
    }, {})
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [complaints])

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
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-10 complaint-hub">
      <div className="mx-auto max-w-5xl complaint-hub-inner">
        <div className="complaint-hub-heading">
          <div>
            <p className="complaint-overline">YOUR CIVIC DASHBOARD</p>
            <h1 className="text-3xl font-bold text-gray-900">My complaints</h1>
            <p className="mt-2 text-gray-600">A clear view of every issue you’ve reported, what’s moving, and where you can follow up.</p>
          </div>
          <Link to="/report" className="citizen-report-button">Report an issue <ArrowUpRight size={16} /></Link>
        </div>

        <section className="complaint-summary-grid" aria-label="Complaint summary">
          <article className="complaint-summary-card"><span><FileText size={15} /> Total reports</span><strong>{complaints.length}</strong><small>Issues submitted by you</small></article>
          <article className="complaint-summary-card"><span><Clock3 size={15} /> Active cases</span><strong>{activeCount}</strong><small>Waiting for a final resolution</small></article>
          <article className="complaint-summary-card"><span><CircleCheck size={15} /> Resolved</span><strong>{resolvedCount}</strong><small>Closed by the civic team</small></article>
          <article className={`complaint-summary-card ${reviewCount ? "complaint-summary-review" : "complaint-summary-intelligence"}`}><span>{reviewCount ? <ClipboardCheck size={15} /> : <Sparkles size={15} />} {reviewCount ? "Your review needed" : "ML review signals"}</span><strong>{reviewCount || aiSignalCount}</strong><small>{reviewCount ? "Please confirm submitted resolutions" : "Category suggestions or duplicate flags"}</small></article>
        </section>

        <section className="citizen-insight-grid">
          <article className="citizen-insight-panel citizen-category-panel">
            <div className="citizen-panel-title"><div><p className="complaint-overline">YOUR REPORTS</p><h2>Issues by category</h2></div><span className="citizen-total-chip">{complaints.length} total</span></div>
            {categoryStats.length ? <div className="citizen-category-bars">{categoryStats.map(([category, count]) => <div className="citizen-category-row" key={category}><div><span>{category}</span><strong>{count}</strong></div><div className="citizen-category-track"><i style={{ width: `${Math.max(8, (count / complaints.length) * 100)}%` }} /></div></div>)}</div> : <p className="citizen-panel-empty">Your category breakdown will appear here after your first report.</p>}
          </article>
          <article className="citizen-insight-panel citizen-next-panel">
            <div className="citizen-panel-title"><div><p className="complaint-overline">A LITTLE GUIDANCE</p><h2>What happens next?</h2></div><span className="citizen-next-icon"><MapPin size={17} /></span></div>
            <p>Follow each case as it moves from submission to action. If a team marks it resolved, you can confirm the outcome or ask them to revisit it.</p>
            <div className="citizen-next-footer"><span><span className="citizen-status-dot" /> {activeCount} active {activeCount === 1 ? "case" : "cases"}</span><span>Updated from your reports</span></div>
          </article>
        </section>

        <div className="complaint-controls">
          <label className="complaint-search"><Search size={17} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your reports" aria-label="Search your complaints" /></label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter complaints by status">
            <option value="All">All statuses</option>
            {[...new Set(complaints.map((complaint) => complaint.status).filter(Boolean))].map((status) => <option key={status}>{status}</option>)}
          </select>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label="Sort complaints by date">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <span className="complaint-result-count">{filteredComplaints.length} {filteredComplaints.length === 1 ? "report" : "reports"}</span>
        </div>

        {message && (
          <p
            role="status"
            className="mb-6 rounded-lg border border-gray-200 bg-white p-4 text-gray-700"
          >
            {message}
          </p>
        )}

        <div className="space-y-6 complaint-list">
          {filteredComplaints.map((complaint) => (
            <article
              key={complaint._id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
                <div className="complaint-evidence">
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
                        className="complaint-evidence-image"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none"
                        }}
                      />
                    </a>
                  ) : (
                    <div className="complaint-evidence-empty">
                      No evidence image available
                    </div>
                  )}
                </div>

                <div className="p-5 sm:p-6">
                  <div className="citizen-case-heading mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div><p className="citizen-case-meta">{formatDate(complaint.createdAt)} · {complaint._id ? `Case ${String(complaint._id).slice(-6).toUpperCase()}` : "Civic report"}</p><h2 className="text-xl font-semibold text-gray-900">
                      {complaint.category}
                    </h2></div>

                    <span className={`citizen-status-badge citizen-status-${String(complaint.status || "pending").toLowerCase().replace(/\s+/g, "-")}`}>
                      {complaint.status}
                    </span>
                  </div>

                  <ComplaintTimeline status={complaint.status} />

                  {complaint.imagePredictedCategory && (
                    <div className="complaint-intelligence-note"><Sparkles size={15} /><span><strong>Image suggestion</strong> {complaint.imagePredictedCategory}<small>Automated signal for review; the civic team confirms the final classification.</small></span></div>
                  )}
                  {complaint.isDuplicate && (
                    <div className="complaint-duplicate-note"><Sparkles size={15} /><span><strong>Similar report detected</strong><small>{complaint.duplicateSimilarity != null ? `Similarity signal: ${complaint.duplicateSimilarity}` : "A related report may exist in this area."} Review remains with the civic team.</small></span></div>
                  )}

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
          {filteredComplaints.length === 0 && !message && (
            <div className="complaint-empty-state"><Search size={20} /><strong>{complaints.length ? "No reports match those filters" : "Your reports will appear here"}</strong><p>{complaints.length ? "Try another search or status." : "When you submit a civic issue, you can follow its status and resolution from this page."}</p></div>
          )}
        </div>
      </div>
    </main>
  )
}

export default MyComplaints
