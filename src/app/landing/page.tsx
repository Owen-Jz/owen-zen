import Link from "next/link";
import "../globals.css";
import "./landing.css";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-container">
        {/* Navigation */}
        <nav className="landing-nav">
          <div className="landing-logo">
            Owen <span>Zen</span>
          </div>
          <ul className="landing-nav-links">
            <li><Link href="/">Dashboard</Link></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#about">About</a></li>
          </ul>
        </nav>

        {/* Hero Section */}
        <section className="landing-hero">
          <div className="landing-hero-badge">
            Focus Mode Active
          </div>
          <h1>
            Master Your <em>Focus</em>,<br />
            Master Your Life
          </h1>
          <p>
            A minimal, Zen-like productivity dashboard designed for deep work
            and intentional living. Track tasks, habits, goals, and more.
          </p>
          <div className="landing-cta-group">
            <Link href="/" className="landing-cta landing-cta-primary">
              Enter Dashboard
            </Link>
            <a href="#features" className="landing-cta landing-cta-secondary">
              Learn More
            </a>
          </div>
        </section>

        {/* Features Section */}
        <section className="landing-features" id="features">
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <h3>Focus Board</h3>
              <p>
                Organize tasks with drag-and-drop simplicity. Prioritize what
                matters most with visual boards and smart filtering.
              </p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3>Habit Tracking</h3>
              <p>
                Build consistent routines with daily protocols. Track streaks,
                measure progress, and build lasting habits.
              </p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 20V10" />
                  <path d="M18 20V4" />
                  <path d="M6 20v-4" />
                </svg>
              </div>
              <h3>Analytics</h3>
              <p>
                Gain insights into your productivity patterns. Understand
                where your time goes and optimize accordingly.
              </p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3>Vision Board</h3>
              <p>
                Visualize your goals and dreams. Keep your eyes on the prize
                with inspiring images and affirmations.
              </p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3>Calendar Integration</h3>
              <p>
                Sync your schedule and stay on top of deadlines. Visual
                calendar views for comprehensive planning.
              </p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h3>Goal Tracking</h3>
              <p>
                Set ambitious goals and track your progress. Weekly goals,
                bucket lists, and roadmap planning all in one place.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="landing-footer-content">
            <div className="landing-footer-left">
              <div className="landing-footer-brand">
                Owen <span>Zen</span>
              </div>
              <p className="landing-footer-copy">
                A minimal productivity dashboard for focused living.
              </p>
            </div>
            <ul className="landing-footer-links">
              <li><Link href="/">Dashboard</Link></li>
              <li><a href="#features">Features</a></li>
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            </ul>
          </div>
        </footer>
      </div>
    </div>
  );
}
