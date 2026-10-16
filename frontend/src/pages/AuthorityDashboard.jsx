import { useCallback, useEffect, useMemo, useState } from "react"

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Popup
} from "react-leaflet"

import "leaflet/dist/leaflet.css"
import api from "../services/api"
import BrandName from "../components/BrandName"

const STATUSES = ["Pending", "In Progress", "Resolved", "Reopened"]
const PRIORITIES = ["High", "Medium", "Low"]
const CATEGORIES = [
  "Garbage",
  "Road Damage",
  "Water",
  "Drainage",
  "Electricity",
  "Other"
]

const DEPARTMENTS = [
  "General",
  "Sanitation",
  "Public Works",
  "Water Supply",
  "Drainage",
  "Electrical"
]

const number = value => Number(value || 0).toLocaleString("en-IN")

const dateLabel = value => {
  if (!value) return "Date unavailable"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
}

const ageInDays = value => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000))
}

const formatDuration = hours => {
  if (hours == null || !Number.isFinite(Number(hours))) return "Not available"
  const value = Number(hours)
  if (value < 24) return `${value} hours`
  const days = value / 24
  return `${days.toFixed(1)} days`
}

function TrendChart({ data = [] }) {
  const width = 620
  const height = 230
  const padding = { top: 18, right: 18, bottom: 34, left: 30 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(1, ...data.map(item => item.complaints || 0))
  const points = data.map((item, index) => ({
    ...item,
    x: padding.left +
      (data.length <= 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth),
    y: padding.top + plotHeight -
      ((item.complaints || 0) / maxValue) * plotHeight
  }))

  const path = points.map((point, index) =>
    `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
  ).join(" ")

  const area = points.length
    ? `${path} L ${points[points.length - 1].x} ${padding.top + plotHeight} L ${points[0].x} ${padding.top + plotHeight} Z`
    : ""

  return (
    <div className="dn-chart-wrap">
      {data.length === 0 ? (
        <p className="dn-empty">No trend data is available yet.</p>
      ) : (
        <>
          <div className="dn-chart-legend">
            <span className="dn-legend-dot" />
            Complaints received per month
          </div>
          <svg
            className="dn-trend-chart"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Monthly complaint trend"
          >
            {[0, 0.25, 0.5, 0.75, 1].map(value => {
              const y = padding.top + plotHeight * value
              return (
                <g key={value}>
                  <line
                    x1={padding.left}
                    x2={width - padding.right}
                    y1={y}
                    y2={y}
                    className="dn-chart-gridline"
                  />
                  <text x={padding.left - 8} y={y + 4} textAnchor="end" className="dn-chart-axis">
                    {Math.round(maxValue * (1 - value))}
                  </text>
                </g>
              )
            })}
            <path d={area} className="dn-chart-area" />
            <path d={path} className="dn-chart-line" />
            {points.map(point => (
              <g key={point.month}>
                <circle cx={point.x} cy={point.y} r="4" className="dn-chart-point" />
                <text
                  x={point.x}
                  y={height - 10}
                  textAnchor="middle"
                  className="dn-chart-axis"
                >
                  {point.label || point.month}
                </text>
                <title>{`${point.month}: ${point.complaints} complaints`}</title>
              </g>
            ))}
          </svg>
        </>
      )}
    </div>
  )
}

function Distribution({ title, items = [], labelKey, countKey = "count" }) {
  const max = Math.max(1, ...items.map(item => Number(item[countKey] || 0)))
  const total = items.reduce((sum, item) => sum + Number(item[countKey] || 0), 0)

  return (
    <section className="dn-panel">
      <div className="dn-panel-heading">
        <div>
          <p className="dn-kicker">BREAKDOWN</p>
          <h2>{title}</h2>
        </div>
        <span className="dn-panel-total">{number(total)}</span>
      </div>

      {items.length === 0 ? (
        <p className="dn-empty">No records available.</p>
      ) : (
        <div className="dn-distribution">
          {items.map(item => {
            const count = Number(item[countKey] || 0)
            const label = item[labelKey]
            return (
              <div className="dn-distribution-row" key={label}>
                <div className="dn-distribution-label">
                  <span>{label}</span>
                  <strong>{number(count)}</strong>
                </div>
                <div className="dn-meter">
                  <span style={{ width: `${(count / max) * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function AuthorityDashboard() {
  const [complaints, setComplaints] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [hotspots, setHotspots] = useState([])
  const [statusFilter, setStatusFilter] = useState("All")
  const [priorityFilter, setPriorityFilter] = useState("All")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("priority")
  const [resolutionDescription, setResolutionDescription] = useState({})
  const [resolutionProof, setResolutionProof] = useState({})
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState("")

  const getToken = () => localStorage.getItem("token")

  const authConfig = () => ({
    headers: { Authorization: `Bearer ${getToken()}` }
  })

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const [complaintResponse, analyticsResponse, hotspotResponse] =
        await Promise.all([
          api.get("/complaints/all", authConfig()),
          api.get("/analytics", authConfig()),
          api.get("/complaints/hotspots", authConfig())
        ])

      setComplaints(complaintResponse.data.complaints || [])
      setAnalytics(analyticsResponse.data)
      setHotspots(hotspotResponse.data.hotspots || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Dashboard data could not be loaded. Check your connection and try again."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const filteredComplaints = useMemo(() => {
    const query = search.trim().toLowerCase()

    const result = complaints.filter(complaint => {
      const matchesStatus =
        statusFilter === "All" || complaint.status === statusFilter
      const matchesPriority =
        priorityFilter === "All" || complaint.priority === priorityFilter
      const matchesCategory =
        categoryFilter === "All" || complaint.category === categoryFilter
      const matchesSearch =
        !query ||
        [
          complaint.description,
          complaint.location,
          complaint.category,
          complaint.department,
          complaint.userId?.name,
          complaint.userId?.email,
          complaint._id
        ].some(value => String(value || "").toLowerCase().includes(query))

      return matchesStatus && matchesPriority && matchesCategory && matchesSearch
    })

    const priorityOrder = { High: 0, Medium: 1, Low: 2 }

    return result.sort((a, b) => {
      if (sortBy === "priority") {
        const difference =
          (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
        if (difference !== 0) return difference
      }

      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      }

      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })
  }, [complaints, statusFilter, priorityFilter, categoryFilter, search, sortBy])

  const summary = analytics?.summary || {}
  const imageSuggestionCount = complaints.filter(item => item.imagePredictedCategory).length
  const duplicateFlagCount = complaints.filter(item => item.isDuplicate).length
  const locatedComplaints = complaints.filter(
    complaint =>
      Number.isFinite(Number(complaint.latitude)) &&
      Number.isFinite(Number(complaint.longitude)) &&
      complaint.latitude !== null &&
      complaint.longitude !== null &&
      Number(complaint.latitude) >= -90 &&
      Number(complaint.latitude) <= 90 &&
      Number(complaint.longitude) >= -180 &&
      Number(complaint.longitude) <= 180
  )

  const mapCenter = locatedComplaints.length
    ? [
        Number(locatedComplaints[0].latitude),
        Number(locatedComplaints[0].longitude)
      ]
    : [28.5355, 77.391]

  const departmentItems = analytics?.departmentDistribution ||
    DEPARTMENTS.map(department => {
      const assigned = complaints.filter(
        complaint => (complaint.department || "General") === department
      )
      return {
        department,
        total: assigned.length,
        open: assigned.filter(item => item.status !== "Resolved").length,
        resolved: assigned.filter(item => item.status === "Resolved").length
      }
    })

  const updateStatus = async (complaintId, status) => {
    setBusyId(complaintId)
    setError("")
    setMessage("")

    try {
      await api.patch(
        `/complaints/${complaintId}/status`,
        { status },
        authConfig()
      )
      setMessage("Complaint status updated.")
      await fetchDashboardData()
    } catch (err) {
      setError(err.response?.data?.message || "Could not update complaint status.")
    } finally {
      setBusyId("")
    }
  }

  const updateDepartment = async (complaintId, department) => {
    setBusyId(complaintId)
    setError("")
    setMessage("")

    try {
      await api.patch(
        `/complaints/${complaintId}/assign`,
        { department },
        authConfig()
      )
      setMessage("Department assignment updated.")
      await fetchDashboardData()
    } catch (err) {
      setError(err.response?.data?.message || "Could not assign department.")
    } finally {
      setBusyId("")
    }
  }

  const resolveComplaint = async complaintId => {
    const description = (resolutionDescription[complaintId] || "").trim()
    const proof = (resolutionProof[complaintId] || "").trim()

    if (!description || !proof) {
      setError("Add both a resolution description and a proof image URL.")
      return
    }

    try {
      new URL(proof)
    } catch {
      setError("Enter a valid proof image URL, including https://.")
      return
    }

    setBusyId(complaintId)
    setError("")
    setMessage("")

    try {
      await api.patch(
        `/complaints/${complaintId}/resolve`,
        {
          resolutionDescription: description,
          resolutionProof: proof
        },
        authConfig()
      )

      setResolutionDescription(previous => ({
        ...previous,
        [complaintId]: ""
      }))
      setResolutionProof(previous => ({
        ...previous,
        [complaintId]: ""
      }))

      setMessage("Complaint marked as resolved.")
      await fetchDashboardData()
    } catch (err) {
      setError(err.response?.data?.message || "Could not resolve complaint.")
    } finally {
      setBusyId("")
    }
  }

  return (
    <main className="dashboard dn-dashboard">
      <header className="dn-dashboard-header">
        <div>
          <p className="dn-kicker"><BrandName className="brand-name-kicker" /> / OPERATIONS</p>
          <h1>Authority workspace</h1>
          <p className="dn-subtitle">
            Monitor incoming reports, identify pressure points, and track resolution.
          </p>
        </div>
        <button className="dn-refresh" onClick={fetchDashboardData} disabled={loading}>
          {loading ? "Refreshing…" : "↻ Refresh data"}
        </button>
      </header>

      {error && <div className="dn-notice dn-notice-error" role="alert">{error}</div>}
      {message && <div className="dn-notice" role="status">{message}</div>}

      {loading && !analytics && complaints.length === 0 ? (
        <div className="dn-loading">Loading records from the server…</div>
      ) : (
        <>
          <section className="dn-overview">
            <div className="dn-overview-heading">
              <div>
                <p className="dn-kicker">CURRENT RECORDS</p>
                <h2>Complaint overview</h2>
              </div>
              <span className="dn-live-label"><span /> Database summary</span>
            </div>

            <div className="dn-metric-grid">
              <article className="dn-metric dn-metric-primary">
                <span>Total complaints</span>
                <strong>{number(summary.total ?? complaints.length)}</strong>
                <small>All recorded reports</small>
              </article>
              <article className="dn-metric">
                <span>Awaiting action</span>
                <strong>{number(summary.pending)}</strong>
                <small>Pending status</small>
              </article>
              <article className="dn-metric">
                <span>In progress</span>
                <strong>{number(summary.inProgress)}</strong>
                <small>Currently being handled</small>
              </article>
              <article className="dn-metric">
                <span>Resolved</span>
                <strong>{number(summary.resolved)}</strong>
                <small>{number(summary.resolutionRate)}% of all records</small>
              </article>
              <article className="dn-metric dn-metric-alert">
                <span>High priority · open</span>
                <strong>{number(summary.unresolvedHighPriority)}</strong>
                <small>Needs attention first</small>
              </article>
              <article className="dn-metric">
                <span>Open for 7+ days</span>
                <strong>{number(summary.openOverSevenDays)}</strong>
                <small>Age-based attention indicator</small>
              </article>
              <article className="dn-metric">
                <span>Average resolution</span>
                <strong className="dn-metric-duration">
                  {formatDuration(summary.averageResolutionHours)}
                </strong>
                <small>{number(summary.resolutionSamples)} resolved records with timestamps</small>
              </article>
              <article className="dn-metric">
                <span>Citizen accepted</span>
                <strong>{number(summary.verified)}</strong>
                <small>{number(summary.verificationRate)}% of resolved records</small>
              </article>
            </div>
          </section>

          <section className="dn-intelligence-panel" aria-label="ML assisted review signals">
            <div className="dn-intelligence-heading">
              <span className="dn-intelligence-icon">✳</span>
              <div>
                <p className="dn-kicker">ML ASSISTED REVIEW</p>
                <h2>Signals to guide the next review</h2>
                <p>Model generated flags help surface context. Review each case before taking action.</p>
              </div>
            </div>
            <div className="dn-intelligence-signals">
              <div><span>Image category suggestions</span><strong>{number(imageSuggestionCount)}</strong><small>Reports with a predicted category</small></div>
              <div><span>Possible duplicate reports</span><strong>{number(duplicateFlagCount)}</strong><small>Flagged records to compare</small></div>
              <div><span>Reports with location</span><strong>{number(locatedComplaints.length)}</strong><small>Records available for map review</small></div>
            </div>
          </section>

          <section className="dn-analytics-grid">
            <div className="dn-panel dn-trend-panel">
              <div className="dn-panel-heading">
                <div>
                  <p className="dn-kicker">VOLUME OVER TIME</p>
                  <h2>Complaint trend</h2>
                </div>
                <span className="dn-muted-small">Last 6 months</span>
              </div>
              <TrendChart data={analytics?.monthlyTrend || []} />
            </div>

            <Distribution
              title="Issue categories"
              items={analytics?.categoryDistribution || []}
              labelKey="category"
            />

            <Distribution
              title="Current status"
              items={analytics?.statusDistribution || []}
              labelKey="status"
            />

            <Distribution
              title="Priority distribution"
              items={analytics?.priorityDistribution || []}
              labelKey="priority"
            />
          </section>

          <section className="dn-panel dn-departments">
            <div className="dn-panel-heading">
              <div>
                <p className="dn-kicker">WORKLOAD</p>
                <h2>Department performance</h2>
                <p className="dn-panel-description">
                  Compare assigned cases with resolved cases. Unassigned reports appear under General.
                </p>
              </div>
            </div>
            <div className="dn-table-scroll">
              <table className="dn-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Assigned</th>
                    <th>Open</th>
                    <th>Resolved</th>
                    <th>Resolution share</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentItems.map(item => (
                    <tr key={item.department}>
                      <td>{item.department}</td>
                      <td>{number(item.total)}</td>
                      <td>{number(item.open)}</td>
                      <td>{number(item.resolved)}</td>
                      <td>
                        <div className="dn-inline-progress">
                          <span
                            style={{
                              width: `${item.total ? (item.resolved / item.total) * 100 : 0}%`
                            }}
                          />
                        </div>
                        <small>{item.total ? Math.round((item.resolved / item.total) * 100) : 0}%</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="dn-panel dn-map-panel">
            <div className="dn-panel-heading">
              <div>
                <p className="dn-kicker">GEOGRAPHIC INTELLIGENCE</p>
                <h2>Reports and detected hotspots</h2>
                <p className="dn-panel-description">
                  {number(locatedComplaints.length)} of {number(complaints.length)} complaints have valid coordinates.
                </p>
              </div>
              <span className="dn-map-key"><i /> Complaint <i className="dn-map-key-hotspot" /> Hotspot</span>
            </div>

            {locatedComplaints.length > 0 ? (
              <MapContainer
                key={`${mapCenter[0]}-${mapCenter[1]}`}
                center={mapCenter}
                zoom={12}
                scrollWheelZoom
                className="complaint-map dn-map"
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {locatedComplaints.map(complaint => (
                  <CircleMarker
                    key={complaint._id}
                    center={[Number(complaint.latitude), Number(complaint.longitude)]}
                    radius={complaint.priority === "High" ? 8 : 5}
                    pathOptions={{
                      color: complaint.status === "Resolved" ? "#39765c" : complaint.priority === "High" ? "#b44c42" : "#315e80",
                      fillOpacity: 0.75
                    }}
                  >
                    <Popup>
                      <strong>{complaint.category}</strong>
                      <p>{complaint.description}</p>
                      <p>{complaint.location}</p>
                      <p>Status: {complaint.status} · Priority: {complaint.priority}</p>
                    </Popup>
                  </CircleMarker>
                ))}

                {hotspots.filter(
                  hotspot =>
                    Number.isFinite(Number(hotspot.center?.latitude)) &&
                    Number.isFinite(Number(hotspot.center?.longitude))
                ).map(hotspot => (
                  <Circle
                    key={`hotspot-${hotspot.cluster_id}`}
                    center={[
                      Number(hotspot.center.latitude),
                      Number(hotspot.center.longitude)
                    ]}
                    radius={100}
                    pathOptions={{
                      color: "#c17a35",
                      fillColor: "#d9a05d",
                      fillOpacity: 0.17
                    }}
                  >
                    <Popup>
                      <strong>Detected hotspot</strong>
                      <p>{number(hotspot.complaint_count)} complaints in this cluster</p>
                    </Popup>
                  </Circle>
                ))}
              </MapContainer>
            ) : (
              <div className="dn-map-empty">
                <strong>No mappable complaint records</strong>
                <p>Coordinates were not available in the loaded records.</p>
              </div>
            )}

            <div className="dn-hotspot-summary">
              <strong>{number(hotspots.length)} detected clusters</strong>
              <span>Hotspot data is supplied by your existing clustering endpoint.</span>
            </div>
          </section>

          <section className="dn-queue-section">
            <div className="dn-queue-heading">
              <div>
                <p className="dn-kicker">CASE MANAGEMENT</p>
                <h2>Complaint queue</h2>
                <p className="dn-panel-description">
                  Search, filter, assign, update, and resolve actual complaint records.
                </p>
              </div>
              <span className="dn-queue-count">{number(filteredComplaints.length)} results</span>
            </div>

            <div className="dn-queue-toolbar">
              <input
                type="search"
                placeholder="Search description, location, citizen or ID"
                value={search}
                onChange={event => setSearch(event.target.value)}
                aria-label="Search complaints"
              />
              <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} aria-label="Filter by status">
                <option value="All">All statuses</option>
                {STATUSES.map(status => <option key={status}>{status}</option>)}
              </select>
              <select value={priorityFilter} onChange={event => setPriorityFilter(event.target.value)} aria-label="Filter by priority">
                <option value="All">All priorities</option>
                {PRIORITIES.map(priority => <option key={priority}>{priority}</option>)}
              </select>
              <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} aria-label="Filter by category">
                <option value="All">All categories</option>
                {CATEGORIES.map(category => <option key={category}>{category}</option>)}
              </select>
              <select value={sortBy} onChange={event => setSortBy(event.target.value)} aria-label="Sort complaints">
                <option value="priority">High priority first</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>

            {filteredComplaints.length === 0 ? (
              <div className="dn-empty dn-queue-empty">
                No complaints match the current search and filters.
                <button
                  className="dn-reset-button"
                  onClick={() => {
                    setSearch("")
                    setStatusFilter("All")
                    setPriorityFilter("All")
                    setCategoryFilter("All")
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="dn-complaint-list">
                {filteredComplaints.map(complaint => {
                  const age = ageInDays(complaint.createdAt)
                  const busy = busyId === complaint._id

                  return (
                    <article className="dn-case" key={complaint._id}>
                      <div className="dn-case-top">
                        <div className="dn-case-title">
                          <span className={`dn-priority-mark dn-priority-${String(complaint.priority || "Medium").toLowerCase()}`} />
                          <div>
                            <p className="dn-case-meta">
                              {complaint.category || "Uncategorised"} · {dateLabel(complaint.createdAt)}
                            </p>
                            <h3>{complaint.description || "No description provided"}</h3>
                          </div>
                        </div>
                        <div className="dn-case-badges">
                          <span className={`dn-status-badge dn-status-${String(complaint.status || "").toLowerCase().replace(/\s+/g, "-")}`}>
                            {complaint.status || "Unknown"}
                          </span>
                          <span className={`dn-priority-badge dn-priority-text-${String(complaint.priority || "").toLowerCase()}`}>
                            {complaint.priority || "Unrated"} priority
                          </span>
                        </div>
                      </div>

                      <div className="dn-case-details">
                        <div>
                          <span>Location</span>
                          <strong>{complaint.location || "Not provided"}</strong>
                        </div>
                        <div>
                          <span>Reported by</span>
                          <strong>{complaint.userId?.name || complaint.userId?.email || "Citizen details unavailable"}</strong>
                        </div>
                        <div>
                          <span>Department</span>
                          <strong>{complaint.department || "General"}</strong>
                        </div>
                        <div>
                          <span>Age</span>
                          <strong>{age == null ? "Unknown" : `${age} day${age === 1 ? "" : "s"}`}</strong>
                        </div>
                      </div>

                      <details className="dn-case-more">
                        <summary>Evidence, classification and case details</summary>
                        <div className="dn-case-extra">
                          <p><strong>Complaint ID:</strong> {complaint._id}</p>
                          <p><strong>Severity:</strong> {complaint.severity ?? "Not recorded"}</p>
                          <p><strong>Duplicate flag:</strong> {complaint.isDuplicate ? `Yes · similarity ${complaint.duplicateSimilarity ?? "not recorded"}` : "No"}</p>
                          <p><strong>Image review:</strong> {complaint.imageVerificationStatus || "Not available"}</p>
                          <p><strong>Image predicted category:</strong> {complaint.imagePredictedCategory || "Not available"}</p>
                          <p><strong>Citizen verification:</strong> {complaint.citizenVerification || "Pending"}</p>
                          {complaint.imageUrl && (
                            <a href={complaint.imageUrl} target="_blank" rel="noreferrer">Open submitted evidence ↗</a>
                          )}
                          {complaint.resolutionProof && (
                            <a href={complaint.resolutionProof} target="_blank" rel="noreferrer">Open resolution proof ↗</a>
                          )}
                          {complaint.resolutionDescription && (
                            <p><strong>Resolution notes:</strong> {complaint.resolutionDescription}</p>
                          )}
                        </div>
                      </details>

                      <div className="dn-case-actions">
                        <label>
                          Update status
                          <select
                            value={complaint.status || "Pending"}
                            onChange={event => updateStatus(complaint._id, event.target.value)}
                            disabled={busy || complaint.status === "Resolved"}
                          >
                            {STATUSES.filter(status => status !== "Resolved").map(status => (
                              <option key={status}>{status}</option>
                            ))}
                            {complaint.status === "Resolved" && <option>Resolved</option>}
                          </select>
                        </label>

                        <label>
                          Assign department
                          <select
                            value={complaint.department || "General"}
                            onChange={event => updateDepartment(complaint._id, event.target.value)}
                            disabled={busy}
                          >
                            {DEPARTMENTS.map(department => (
                              <option key={department}>{department}</option>
                            ))}
                          </select>
                        </label>
                      </div>

                      {complaint.status !== "Resolved" && (
                        <details className="dn-resolve-details">
                          <summary>Record resolution</summary>
                          <div className="dn-resolve-form">
                            <label>
                              Resolution notes
                              <textarea
                                rows="3"
                                placeholder="Describe the work completed"
                                value={resolutionDescription[complaint._id] || ""}
                                onChange={event => setResolutionDescription(previous => ({
                                  ...previous,
                                  [complaint._id]: event.target.value
                                }))}
                              />
                            </label>
                            <label>
                              Proof image URL
                              <input
                                type="url"
                                placeholder="https://…"
                                value={resolutionProof[complaint._id] || ""}
                                onChange={event => setResolutionProof(previous => ({
                                  ...previous,
                                  [complaint._id]: event.target.value
                                }))}
                              />
                            </label>
                            <button
                              className="dn-resolve-button"
                              onClick={() => resolveComplaint(complaint._id)}
                              disabled={busy}
                            >
                              {busy ? "Saving…" : "Submit resolution"}
                            </button>
                          </div>
                        </details>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default AuthorityDashboard
