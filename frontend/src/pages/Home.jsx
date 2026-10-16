import { Link } from "react-router-dom"
import { ScanSearch, CopyCheck, MapPinned, ChartNoAxesCombined, ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import BrandName from "../components/BrandName"

const categories = [
  {
    name: "Road damage",
    detail: "Potholes, broken roads and damaged surfaces",
    symbol: "01",
  },
  {
    name: "Garbage",
    detail: "Waste accumulation and uncollected rubbish",
    symbol: "02",
  },
  {
    name: "Water",
    detail: "Leaks, water supply and wastage",
    symbol: "03",
  },
  {
    name: "Drainage",
    detail: "Blocked drains and waterlogging",
    symbol: "04",
  },
  {
    name: "Electricity",
    detail: "Streetlights and electrical infrastructure",
    symbol: "05",
  },
  {
    name: "Other issues",
    detail: "Other problems affecting public spaces",
    symbol: "06",
  },
]

const intelligenceFeatures = [
  {
    icon: ScanSearch,
    title: "Photo assisted review",
    description: "Submitted evidence can support an image based category suggestion for the reviewing team.",
    tag: "IMAGE SIGNALS",
  },
  {
    icon: CopyCheck,
    title: "Duplicate awareness",
    description: "Similar reports can be surfaced together so teams can understand the scale of an issue.",
    tag: "SIMILAR REPORTS",
  },
  {
    icon: MapPinned,
    title: "Location context",
    description: "Verified coordinates help place reports on the area map and reveal nearby clusters.",
    tag: "GEO CONTEXT",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Priority and trends",
    description: "Severity, status and report history help authorities see what needs attention first.",
    tag: "OPERATIONS",
  },
]

function Home() {
  const { user } = useAuth()

  const isAuthority = user?.role === "authority"

  const primaryLink = user
    ? isAuthority
      ? "/authority"
      : "/report"
    : "/login"

  const primaryLabel = user
    ? isAuthority
      ? "Open authority dashboard"
      : "Report an issue"
    : "Sign in to report"

  const categoryLink = isAuthority ? "/authority" : primaryLink

  return (
    <main className="civic-home">
      <section className="civic-intro">
        <div className="civic-intro-copy">
          <h1>
            Local issues.
            <br />
            <span>Clear action.</span>
          </h1>

          <p className="civic-intro-description">
            One clear report can help a whole neighbourhood move forward. Add
            on-site evidence, get useful review signals, and follow the response.
          </p>

          <div className="civic-hero-signals" aria-label="Platform capabilities">
            <span><ShieldCheck size={15} /> Verified evidence</span>
            <span><Sparkles size={15} /> ML review signals</span>
          </div>

          <div className="civic-intro-actions">
            <Link to={primaryLink} className="civic-primary-button">
              {primaryLabel}
            </Link>

            {user && !isAuthority && (
              <Link to="/complaints" className="civic-secondary-link">
                Track my complaints
              </Link>
            )}

            {!user && (
              <Link to="/register" className="civic-secondary-link">
                Create an account
              </Link>
            )}
          </div>

          <p className="civic-intro-footnote">
            Clear updates from first review through final resolution.
          </p>
        </div>

        <div className="civic-map-panel">
          <div className="civic-map-heading">
            <div>
              <p className="civic-map-label">NEIGHBOURHOOD VIEW</p>
              <h2>Surajpur, Greater Noida</h2>
            </div>

            <span className="civic-map-index"><span className="civic-map-pulse" /> AREA MAP</span>
          </div>

          <iframe
            className="civic-map-frame"
            title="Map of Surajpur, Greater Noida"
            src="https://www.openstreetmap.org/export/embed.html?bbox=77.49%2C28.49%2C77.57%2C28.55&layer=mapnik"
            loading="lazy"
          />

          <div className="civic-map-footer">
            <span>Neighbourhood reference map</span>

            <a
              href="https://www.openstreetmap.org/#map=14/28.52/77.53"
              target="_blank"
              rel="noreferrer"
            >
              Explore map
            </a>
          </div>
        </div>
      </section>

      <section className="civic-category-section" id="issue-categories">
        <div className="civic-section-heading">
          <div>
            <p className="civic-kicker">ISSUE CATEGORIES</p>
            <h2>What needs attention?</h2>
          </div>

          <p>
            Select an issue category to begin reporting. Include the location
            and supporting evidence to help the responsible team understand
            the problem.
          </p>
        </div>

        <div className="civic-category-grid">
          {categories.map((category) => (
            <Link
              to={categoryLink}
              className="civic-category-item"
              key={category.name}
              aria-label={`Go to ${category.name} reporting`}
            >
              <span className="civic-category-number">{category.symbol}</span>

              <div className="civic-category-copy">
                <h3>{category.name}</h3>
                <p>{category.detail}</p>
              </div>

            </Link>
          ))}
        </div>
      </section>

      <section className="intelligence-section" aria-labelledby="intelligence-title">
        <div className="intelligence-heading">
          <div>
            <p className="civic-kicker"><span className="intelligence-spark">✳</span> INTELLIGENCE, WITH HUMAN OVERSIGHT</p>
            <h2 id="intelligence-title">More context for every civic decision.</h2>
          </div>
          <p><BrandName /> brings report details, evidence and location signals into one review workflow. Automated signals help teams triage; people make the decisions.</p>
        </div>

        <div className="intelligence-grid">
          {intelligenceFeatures.map(({ icon: Icon, title, description, tag }, index) => (
            <article className="intelligence-card" key={title}>
              <div className="intelligence-card-top">
                <span className="intelligence-icon"><Icon size={19} strokeWidth={1.8} /></span>
                <span className="intelligence-index">0{index + 1}</span>
              </div>
              <span className="intelligence-tag">{tag}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <Link to={primaryLink} className="intelligence-link">{user ? "Continue to your workspace" : "See how it works"}<ArrowUpRight size={16} /></Link>
      </section>

      <section className="civic-process-section">
        <div className="civic-process-intro">
          <p className="civic-kicker">HOW IT WORKS</p>

          <h2>A report should have a clear next step.</h2>

          <p>
            Follow the complaint from submission to review and resolution
            through a straightforward reporting process.
          </p>
        </div>

        <div className="civic-process-list">
          <article className="civic-process-row">
            <span>01</span>

            <div>
              <h3>Submit the issue</h3>
              <p>
                Describe the problem and provide a photograph and location
                where available.
              </p>
            </div>
          </article>

          <article className="civic-process-row">
            <span>02</span>

            <div>
              <h3>Review and route</h3>
              <p>
                Classification and department assignment help direct the
                report to the relevant civic team.
              </p>
            </div>
          </article>

          <article className="civic-process-row">
            <span>03</span>

            <div>
              <h3>Follow the outcome</h3>
              <p>
                Check status updates and review resolution evidence when it
                has been provided.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="civic-bottom-cta">
        <div>
          <p className="civic-kicker">TAKE ACTION</p>

          <h2>Noticed something that needs fixing?</h2>

          <p>
            Record the details so the issue can be reviewed by the
            appropriate team.
          </p>
        </div>

        <Link to={primaryLink} className="civic-primary-button">
          {primaryLabel}
          
        </Link>
      </section>

      <footer className="civic-home-footer">
        <Link to="/" className="civic-footer-brand">
          <BrandName />
        </Link>

        <p>Community reporting. Clearer follow-up. Accountable action.</p>

        <a href="#issue-categories">
          Explore issue categories
        </a>
      </footer>
    </main>
  )
}

export default Home
