import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Database,
  Gauge,
  Lightbulb,
  Loader2,
  MessageSquareText,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ============================================================
   CONFIG
============================================================ */

const API_BASE =
  import.meta.env.VITE_APP_SERVER_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

/*
  Change these two routes only if your project uses different
  frontend route names.

  Nothing in the backend contract dictates frontend routes.
*/
const ANALYTICS_ROUTE = "/analytics";
const ASK_METRIA_ROUTE = "/ask-metria";

/* ============================================================
   HELPERS
============================================================ */

const getToken = () =>
  localStorage.getItem("adt_token") ||
  localStorage.getItem("token") ||
  "";

const safeString = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;

  const stringValue = String(value).trim();

  return stringValue || fallback;
};

const sentenceCase = (value) => {
  const text = safeString(value);

  if (!text) return "";

  return text.charAt(0).toUpperCase() + text.slice(1);
};

const formatGeneratedTime = (value) => {
  if (!value) return "Just now";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const diff = Date.now() - date.getTime();

  if (diff < 0) {
    return date.toLocaleString();
  }

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${minutes} mins ago`;

  const hours = Math.floor(minutes / 60);

  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);

  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getHealthConfig = (status) => {
  switch (safeString(status).toLowerCase()) {
    case "strong":
      return {
        label: "Strong",
        className: "overview-status overview-status--strong",
        icon: CheckCircle2,
      };

    case "stable":
      return {
        label: "Stable",
        className: "overview-status overview-status--stable",
        icon: Activity,
      };

    case "watch":
      return {
        label: "Needs attention",
        className: "overview-status overview-status--watch",
        icon: CircleAlert,
      };

    case "critical":
      return {
        label: "Critical",
        className: "overview-status overview-status--critical",
        icon: AlertTriangle,
      };

    default:
      return {
        label: "Insufficient signal",
        className: "overview-status overview-status--unknown",
        icon: Gauge,
      };
  }
};

const getDirectionConfig = (direction) => {
  switch (safeString(direction).toLowerCase()) {
    case "up":
      return {
        label: "Moving up",
        icon: ArrowUpRight,
        className: "signal-direction signal-direction--up",
      };

    case "down":
      return {
        label: "Moving down",
        icon: ArrowDownRight,
        className: "signal-direction signal-direction--down",
      };

    case "mixed":
      return {
        label: "Mixed movement",
        icon: Activity,
        className: "signal-direction signal-direction--mixed",
      };

    case "flat":
      return {
        label: "Mostly flat",
        icon: ArrowRight,
        className: "signal-direction signal-direction--flat",
      };

    default:
      return {
        label: "Direction unknown",
        icon: Activity,
        className: "signal-direction signal-direction--unknown",
      };
  }
};

const getRiskClass = (severity) => {
  switch (safeString(severity).toLowerCase()) {
    case "high":
      return "risk-badge risk-badge--high";

    case "medium":
      return "risk-badge risk-badge--medium";

    case "low":
      return "risk-badge risk-badge--low";

    default:
      return "risk-badge risk-badge--unknown";
  }
};

const normaliseQuestions = (questions) => {
  if (!Array.isArray(questions)) return [];

  return questions
    .filter((question) => typeof question === "string")
    .map((question) => question.trim())
    .filter(Boolean)
    .slice(0, 3);
};

const normaliseWatchlist = (watchlist) => {
  if (!Array.isArray(watchlist)) return [];

  return watchlist
    .filter((item) => item && typeof item === "object")
    .slice(0, 4);
};

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function SectionHeading({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
}) {
  return (
    <div className="overview-section-heading">
      <div className="overview-section-heading__left">
        {Icon ? (
          <div className="overview-section-heading__icon">
            <Icon size={17} strokeWidth={2} />
          </div>
        ) : null}

        <div>
          {eyebrow ? (
            <div className="overview-eyebrow">{eyebrow}</div>
          ) : null}

          <h2>{title}</h2>

          {description ? (
            <p>{description}</p>
          ) : null}
        </div>
      </div>

      {action ? (
        <div className="overview-section-heading__action">
          {action}
        </div>
      ) : null}
    </div>
  );
}

function IntelligenceCard({
  icon: Icon,
  eyebrow,
  title,
  body,
  footer,
  tone = "default",
}) {
  return (
    <article
      className={`intelligence-card intelligence-card--${tone}`}
    >
      <div className="intelligence-card__top">
        <div className="intelligence-card__icon">
          <Icon size={18} strokeWidth={2} />
        </div>

        <span>{eyebrow}</span>
      </div>

      <h3>{title || "Not enough information yet"}</h3>

      <p>
        {body ||
          "Metria needs more analytical evidence before making a reliable call."}
      </p>

      {footer ? (
        <div className="intelligence-card__footer">
          {footer}
        </div>
      ) : null}
    </article>
  );
}

function LoadingOverview() {
  return (
    <div className="overview-loading">
      <div className="overview-loading__orb">
        <Brain size={30} strokeWidth={1.8} />
        <span className="overview-loading__pulse" />
      </div>

      <h2>Metria is reading your business</h2>

      <p>
        Reviewing your latest analysis, business signals and
        relevant Ask Metria context.
      </p>

      <div className="overview-loading__bars">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function EmptyOverview({ onOpenAnalytics }) {
  return (
    <div className="overview-empty">
      <div className="overview-empty__visual">
        <div className="overview-empty__icon">
          <BarChart3 size={32} strokeWidth={1.8} />
        </div>

        <span className="overview-empty__dot overview-empty__dot--1" />
        <span className="overview-empty__dot overview-empty__dot--2" />
        <span className="overview-empty__dot overview-empty__dot--3" />
      </div>

      <div className="overview-eyebrow">
        Your business operating system
      </div>

      <h1>Give Metria something to watch.</h1>

      <p>
        Once you analyse business data, your Overview becomes a
        living executive briefing — showing what changed, what
        matters, what needs attention and what to do next.
      </p>

      <button
        type="button"
        className="overview-primary-button"
        onClick={onOpenAnalytics}
      >
        <Sparkles size={17} />
        Analyse business data
        <ArrowRight size={17} />
      </button>

      <div className="overview-empty__features">
        <span>
          <Activity size={15} />
          Business health
        </span>

        <span>
          <ShieldAlert size={15} />
          Risks
        </span>

        <span>
          <TrendingUp size={15} />
          Opportunities
        </span>

        <span>
          <Brain size={15} />
          AI priorities
        </span>
      </div>
    </div>
  );
}

function ErrorOverview({ message, onRetry }) {
  return (
    <div className="overview-error">
      <div className="overview-error__icon">
        <AlertTriangle size={27} />
      </div>

      <h2>Metria couldn't load your overview</h2>

      <p>
        {message ||
          "The intelligence service could not be reached. Your saved analytics have not been affected."}
      </p>

      <button
        type="button"
        className="overview-secondary-button"
        onClick={onRetry}
      >
        <RefreshCw size={16} />
        Try again
      </button>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function Overview() {
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchOverview = useCallback(
    async ({ force = false } = {}) => {
      const token = getToken();

      if (!token) {
        setError("Your session has expired. Please sign in again.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (force) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await fetch(
          `${API_BASE}/overview/intelligence`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              force,
            }),
          }
        );

        let data = null;

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "Your session has expired. Please sign in again."
            );
          }

          throw new Error(
            data?.detail ||
              "Metria could not generate your business overview."
          );
        }

        setOverview(data);
      } catch (requestError) {
        console.error(
          "[Metria Overview Error]",
          requestError
        );

        setError(
          requestError?.message ||
            "Metria could not load your overview."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const brief = overview?.brief || null;

  const healthConfig = useMemo(
    () => getHealthConfig(brief?.health?.status),
    [brief?.health?.status]
  );

  const directionConfig = useMemo(
    () => getDirectionConfig(brief?.change?.direction),
    [brief?.change?.direction]
  );

  const questions = useMemo(
    () => normaliseQuestions(brief?.suggested_questions),
    [brief?.suggested_questions]
  );

  const watchlist = useMemo(
    () => normaliseWatchlist(brief?.watchlist),
    [brief?.watchlist]
  );

  const HealthIcon = healthConfig.icon;
  const DirectionIcon = directionConfig.icon;

  const organization =
    safeString(brief?.meta?.organization) ||
    "Your business";

  const industry =
    safeString(brief?.meta?.industry) ||
    "Business";

  const datasetCount =
    Number(brief?.meta?.dataset_count) || 0;

  const confidence =
    typeof brief?.confidence === "number"
      ? brief.confidence
      : null;

  const openAnalytics = () => {
    navigate(ANALYTICS_ROUTE);
  };

  const openAskMetria = (question = "") => {
    /*
      Passing the question in router state avoids placing business
      context in the URL.

      In AskMetria you can optionally read:

      const location = useLocation();
      const initialQuestion = location.state?.initialQuestion;

      and prefill/send it.
    */
    navigate(ASK_METRIA_ROUTE, {
      state: question
        ? {
            initialQuestion: question,
            source: "overview",
          }
        : {
            source: "overview",
          },
    });
  };

  if (loading) {
    return (
      <>
        <OverviewStyles />

        <main className="metria-overview">
          <LoadingOverview />
        </main>
      </>
    );
  }

  if (error && !overview) {
    return (
      <>
        <OverviewStyles />

        <main className="metria-overview">
          <ErrorOverview
            message={error}
            onRetry={() => fetchOverview()}
          />
        </main>
      </>
    );
  }

  if (
    !overview?.has_data ||
    overview?.status === "empty" ||
    !brief
  ) {
    return (
      <>
        <OverviewStyles />

        <main className="metria-overview">
          <EmptyOverview
            onOpenAnalytics={openAnalytics}
          />
        </main>
      </>
    );
  }

  return (
    <>
      <OverviewStyles />

      <main className="metria-overview">
        {/* ====================================================
            TOP BAR
        ==================================================== */}

        <header className="overview-topbar">
          <div>
            <div className="overview-eyebrow">
              Metria Intelligence
            </div>

            <h1>Overview</h1>
          </div>

          <div className="overview-topbar__actions">
            <div className="overview-freshness">
              <span className="overview-live-dot" />

              <div>
                <span>Business intelligence</span>

                <strong>
                  Updated{" "}
                  {formatGeneratedTime(
                    overview?.generated_at
                  )}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="overview-refresh-button"
              disabled={refreshing}
              onClick={() =>
                fetchOverview({
                  force: true,
                })
              }
              title="Refresh business intelligence"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing ? "spin" : ""
                }
              />

              {refreshing
                ? "Refreshing"
                : "Refresh"}
            </button>
          </div>
        </header>

        {error ? (
          <div className="overview-inline-error">
            <AlertTriangle size={15} />
            {error}
          </div>
        ) : null}

        {/* ====================================================
            HERO / EXECUTIVE BRIEF
        ==================================================== */}

        <section className="overview-hero">
          <div className="overview-hero__glow" />

          <div className="overview-hero__content">
            <div className="overview-hero__identity">
              <span className="overview-company-pill">
                {organization}
              </span>

              <span className="overview-industry">
                {industry}
              </span>
            </div>

            <div className="overview-hero__status-row">
              <div className={healthConfig.className}>
                <HealthIcon size={15} />
                {brief?.health?.label ||
                  healthConfig.label}
              </div>

              <span className="overview-hero__timestamp">
                <Clock3 size={14} />
                Live executive state
              </span>
            </div>

            <h2>
              {brief?.headline ||
                "Metria is monitoring your business."}
            </h2>

            <p className="overview-hero__brief">
              {brief?.executive_brief ||
                "Your latest business intelligence is ready."}
            </p>

            <div className="overview-hero__actions">
              <button
                type="button"
                className="overview-primary-button"
                onClick={() => openAskMetria()}
              >
                <MessageSquareText size={17} />
                Ask Metria
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="overview-ghost-button"
                onClick={openAnalytics}
              >
                <BarChart3 size={16} />
                Open analytics
              </button>
            </div>
          </div>

          <div className="overview-hero__side">
            <div className="health-panel">
              <div className="health-panel__top">
                <span>Business health</span>

                <Activity size={17} />
              </div>

              <div className="health-panel__status">
                {brief?.health?.label ||
                  healthConfig.label}
              </div>

              <p>
                {brief?.health?.reason ||
                  "Metria does not yet have enough evidence to explain the current health state."}
              </p>

              <div className="health-panel__footer">
                <span>
                  <Database size={14} />
                  {datasetCount}{" "}
                  {datasetCount === 1
                    ? "dataset"
                    : "datasets"}
                </span>

                {confidence !== null ? (
                  <span>
                    <Gauge size={14} />
                    {confidence <= 1
                      ? `${Math.round(
                          confidence * 100
                        )}% confidence`
                      : `${Math.round(
                          confidence
                        )}% confidence`}
                  </span>
                ) : (
                  <span>
                    <Brain size={14} />
                    Evidence-led
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            WHAT CHANGED + PRIORITY
        ==================================================== */}

        <section className="overview-section">
          <SectionHeading
            eyebrow="Right now"
            title="What deserves your attention"
            description="The most important movement and action Metria sees in your latest business state."
            icon={Zap}
          />

          <div className="overview-focus-grid">
            <article className="focus-card focus-card--change">
              <div className="focus-card__header">
                <div className="focus-card__label">
                  <Activity size={17} />
                  Biggest change
                </div>

                <div
                  className={
                    directionConfig.className
                  }
                >
                  <DirectionIcon size={14} />
                  {directionConfig.label}
                </div>
              </div>

              <h3>
                {brief?.change?.headline ||
                  "No reliable change detected yet"}
              </h3>

              <p>
                {brief?.change?.detail ||
                  "Metria needs more historical analytical evidence before identifying a meaningful change."}
              </p>
            </article>

            <article className="focus-card focus-card--priority">
              <div className="focus-card__header">
                <div className="focus-card__label">
                  <Target size={17} />
                  Priority
                </div>

                <span className="priority-chip">
                  Do next
                </span>
              </div>

              <h3>
                {brief?.priority?.title ||
                  "Continue building business signal"}
              </h3>

              <p>
                {brief?.priority?.reason ||
                  "Metria needs more evidence before recommending a specific business action."}
              </p>

              {brief?.priority?.expected_impact ? (
                <div className="expected-impact">
                  <TrendingUp size={15} />

                  <div>
                    <span>Expected impact</span>
                    <strong>
                      {
                        brief.priority
                          .expected_impact
                      }
                    </strong>
                  </div>
                </div>
              ) : null}
            </article>
          </div>
        </section>

        {/* ====================================================
            RISK + OPPORTUNITY
        ==================================================== */}

        <section className="overview-section">
          <SectionHeading
            eyebrow="Decision intelligence"
            title="Risk and opportunity"
            description="The clearest downside to protect against and upside worth investigating."
            icon={Brain}
          />

          <div className="overview-intelligence-grid">
            <IntelligenceCard
              icon={ShieldAlert}
              eyebrow="Risk to watch"
              title={brief?.risk?.title}
              body={brief?.risk?.detail}
              tone="risk"
              footer={
                <span
                  className={getRiskClass(
                    brief?.risk?.severity
                  )}
                >
                  {sentenceCase(
                    brief?.risk?.severity ||
                      "unknown"
                  )}{" "}
                  severity
                </span>
              }
            />

            <IntelligenceCard
              icon={Lightbulb}
              eyebrow="Opportunity"
              title={brief?.opportunity?.title}
              body={brief?.opportunity?.detail}
              tone="opportunity"
              footer={
                <button
                  type="button"
                  className="text-action"
                  onClick={() =>
                    openAskMetria(
                      brief?.opportunity?.title
                        ? `Investigate this opportunity further: ${brief.opportunity.title}`
                        : "What is the strongest opportunity in my current business data?"
                    )
                  }
                >
                  Investigate with Metria
                  <ChevronRight size={15} />
                </button>
              }
            />
          </div>
        </section>

        {/* ====================================================
            PERSONALIZATION
        ==================================================== */}

        {brief?.personalization?.focus ? (
          <section className="overview-section">
            <div className="personalized-card">
              <div className="personalized-card__icon">
                <Sparkles size={20} />
              </div>

              <div className="personalized-card__content">
                <div className="overview-eyebrow">
                  Personalized for you
                </div>

                <h3>
                  {brief.personalization.focus}
                </h3>

                {brief?.personalization?.reason ? (
                  <p>
                    {
                      brief.personalization
                        .reason
                    }
                  </p>
                ) : null}
              </div>

              <div className="personalized-card__badge">
                <Brain size={14} />
                Learned from your Metria usage
              </div>
            </div>
          </section>
        ) : null}

        {/* ====================================================
            WATCHLIST
        ==================================================== */}

        {watchlist.length > 0 ? (
          <section className="overview-section">
            <SectionHeading
              eyebrow="Always watching"
              title="Metria watchlist"
              description="Signals worth keeping an eye on as your business data evolves."
              icon={Activity}
            />

            <div className="watchlist-grid">
              {watchlist.map((item, index) => (
                <article
                  className="watchlist-item"
                  key={`${item?.label || "watch"}-${index}`}
                >
                  <div className="watchlist-item__number">
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <div>
                    <h3>
                      {item?.label ||
                        "Business signal"}
                    </h3>

                    <p>
                      {item?.reason ||
                        "Metria is monitoring this signal for meaningful movement."}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {/* ====================================================
            ASK METRIA
        ==================================================== */}

        <section className="overview-section overview-section--last">
          <div className="ask-metria-panel">
            <div className="ask-metria-panel__intro">
              <div className="ask-metria-panel__icon">
                <MessageSquareText
                  size={22}
                  strokeWidth={1.9}
                />
              </div>

              <div>
                <div className="overview-eyebrow">
                  Go deeper
                </div>

                <h2>Ask Metria about this.</h2>

                <p>
                  Your analyst already has context
                  from the business intelligence
                  above. Continue the investigation
                  instead of starting from scratch.
                </p>
              </div>
            </div>

            {questions.length > 0 ? (
              <div className="suggested-questions">
                {questions.map(
                  (question, index) => (
                    <button
                      type="button"
                      key={`${question}-${index}`}
                      onClick={() =>
                        openAskMetria(question)
                      }
                    >
                      <span>{question}</span>
                      <ArrowRight size={16} />
                    </button>
                  )
                )}
              </div>
            ) : (
              <button
                type="button"
                className="overview-primary-button"
                onClick={() => openAskMetria()}
              >
                <MessageSquareText size={17} />
                Open Ask Metria
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </section>

        {/* ====================================================
            FOOTER META
        ==================================================== */}

        <footer className="overview-footer">
          <div>
            <span className="overview-live-dot" />
            Metria intelligence active
          </div>

          <div>
            {datasetCount}{" "}
            {datasetCount === 1
              ? "dataset"
              : "datasets"}{" "}
            connected to this briefing
          </div>
        </footer>
      </main>
    </>
  );
}

/* ============================================================
   STYLES
============================================================ */

function OverviewStyles() {
  return (
    <style>{`
      :root {
        --overview-bg: #f6f7fb;
        --overview-card: #ffffff;
        --overview-text: #111827;
        --overview-muted: #667085;
        --overview-subtle: #98a2b3;
        --overview-border: #e8eaf0;
        --overview-purple: #6c4cff;
        --overview-purple-dark: #5138d8;
        --overview-purple-soft: #f2efff;
        --overview-green: #138a5b;
        --overview-green-soft: #eaf8f1;
        --overview-yellow: #a66b00;
        --overview-yellow-soft: #fff7df;
        --overview-red: #c43d4b;
        --overview-red-soft: #fff0f1;
        --overview-blue: #2774d8;
        --overview-blue-soft: #eef6ff;
        --overview-shadow:
          0 1px 2px rgba(16, 24, 40, 0.03),
          0 12px 30px rgba(16, 24, 40, 0.04);
      }

      * {
        box-sizing: border-box;
      }

      .metria-overview {
        width: 100%;
        min-height: 100vh;
        padding: 38px 42px 48px;
        background:
          radial-gradient(
            circle at 70% -10%,
            rgba(108, 76, 255, 0.055),
            transparent 28%
          ),
          var(--overview-bg);
        color: var(--overview-text);
      }

      .overview-eyebrow {
        margin-bottom: 7px;
        color: var(--overview-purple);
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .overview-topbar {
        max-width: 1440px;
        margin: 0 auto 28px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
      }

      .overview-topbar h1 {
        margin: 0;
        font-size: clamp(28px, 3vw, 38px);
        line-height: 1;
        letter-spacing: -0.04em;
      }

      .overview-topbar__actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .overview-freshness {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 13px;
        border: 1px solid var(--overview-border);
        border-radius: 12px;
        background: rgba(255,255,255,0.78);
      }

      .overview-freshness div {
        display: flex;
        flex-direction: column;
        gap: 1px;
      }

      .overview-freshness span {
        color: var(--overview-muted);
        font-size: 10px;
        font-weight: 600;
      }

      .overview-freshness strong {
        font-size: 11px;
        font-weight: 700;
      }

      .overview-live-dot {
        width: 8px;
        height: 8px;
        flex: 0 0 auto;
        border-radius: 999px;
        background: #1ca66f;
        box-shadow: 0 0 0 4px rgba(28,166,111,0.1);
      }

      .overview-refresh-button,
      .overview-secondary-button,
      .overview-ghost-button,
      .overview-primary-button {
        border: 0;
        font: inherit;
        cursor: pointer;
        transition:
          transform 160ms ease,
          box-shadow 160ms ease,
          background 160ms ease,
          border-color 160ms ease;
      }

      .overview-refresh-button {
        height: 43px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 0 15px;
        border: 1px solid var(--overview-border);
        border-radius: 12px;
        background: white;
        color: #344054;
        font-size: 12px;
        font-weight: 700;
      }

      .overview-refresh-button:hover:not(:disabled),
      .overview-secondary-button:hover,
      .overview-ghost-button:hover {
        border-color: #d0d5dd;
        background: #fafafa;
      }

      .overview-refresh-button:disabled {
        cursor: wait;
        opacity: 0.65;
      }

      .overview-primary-button {
        min-height: 43px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        padding: 0 17px;
        border-radius: 12px;
        background:
          linear-gradient(
            135deg,
            var(--overview-purple),
            #7d5cff
          );
        color: white;
        box-shadow:
          0 7px 18px rgba(108,76,255,0.19);
        font-size: 12px;
        font-weight: 750;
      }

      .overview-primary-button:hover {
        transform: translateY(-1px);
        box-shadow:
          0 10px 24px rgba(108,76,255,0.24);
      }

      .overview-ghost-button,
      .overview-secondary-button {
        min-height: 43px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 16px;
        border: 1px solid var(--overview-border);
        border-radius: 12px;
        background: white;
        color: #344054;
        font-size: 12px;
        font-weight: 700;
      }

      .overview-inline-error {
        max-width: 1440px;
        margin: -10px auto 18px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 13px;
        border: 1px solid #ffd8dc;
        border-radius: 10px;
        background: #fff6f7;
        color: #a82e3a;
        font-size: 12px;
      }

      .overview-hero {
        position: relative;
        max-width: 1440px;
        min-height: 390px;
        margin: 0 auto;
        overflow: hidden;
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(310px, 0.55fr);
        gap: 34px;
        padding: clamp(30px, 4vw, 54px);
        border: 1px solid #e7e3ff;
        border-radius: 25px;
        background:
          linear-gradient(
            125deg,
            #ffffff 0%,
            #fbfaff 48%,
            #f3f0ff 100%
          );
        box-shadow: var(--overview-shadow);
      }

      .overview-hero__glow {
        position: absolute;
        width: 430px;
        height: 430px;
        right: -180px;
        top: -210px;
        border-radius: 999px;
        background:
          radial-gradient(
            circle,
            rgba(108,76,255,0.17),
            rgba(108,76,255,0)
          );
        pointer-events: none;
      }

      .overview-hero__content,
      .overview-hero__side {
        position: relative;
        z-index: 1;
      }

      .overview-hero__content {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .overview-hero__identity {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 9px;
        margin-bottom: 22px;
      }

      .overview-company-pill {
        padding: 6px 10px;
        border: 1px solid #e1dcff;
        border-radius: 999px;
        background: white;
        color: #5b42d7;
        font-size: 11px;
        font-weight: 750;
      }

      .overview-industry {
        color: var(--overview-muted);
        font-size: 11px;
        font-weight: 600;
      }

      .overview-hero__status-row {
        display: flex;
        align-items: center;
        gap: 13px;
        margin-bottom: 15px;
      }

      .overview-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 9px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 750;
      }

      .overview-status--strong {
        background: var(--overview-green-soft);
        color: var(--overview-green);
      }

      .overview-status--stable {
        background: var(--overview-blue-soft);
        color: var(--overview-blue);
      }

      .overview-status--watch {
        background: var(--overview-yellow-soft);
        color: var(--overview-yellow);
      }

      .overview-status--critical {
        background: var(--overview-red-soft);
        color: var(--overview-red);
      }

      .overview-status--unknown {
        background: #f2f4f7;
        color: #667085;
      }

      .overview-hero__timestamp {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--overview-subtle);
        font-size: 10px;
        font-weight: 600;
      }

      .overview-hero h2 {
        max-width: 820px;
        margin: 0;
        color: #101828;
        font-size: clamp(30px, 4vw, 50px);
        line-height: 1.08;
        letter-spacing: -0.048em;
      }

      .overview-hero__brief {
        max-width: 780px;
        margin: 20px 0 0;
        color: #5f6675;
        font-size: clamp(14px, 1.4vw, 16px);
        line-height: 1.75;
      }

      .overview-hero__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 28px;
      }

      .overview-hero__side {
        display: flex;
        align-items: center;
      }

      .health-panel {
        width: 100%;
        padding: 24px;
        border: 1px solid rgba(255,255,255,0.9);
        border-radius: 19px;
        background: rgba(255,255,255,0.74);
        backdrop-filter: blur(15px);
        box-shadow:
          0 15px 45px rgba(74,56,160,0.08);
      }

      .health-panel__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: var(--overview-purple);
        font-size: 11px;
        font-weight: 750;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .health-panel__status {
        margin-top: 23px;
        color: #101828;
        font-size: clamp(25px, 3vw, 34px);
        font-weight: 800;
        letter-spacing: -0.04em;
      }

      .health-panel > p {
        min-height: 58px;
        margin: 11px 0 23px;
        color: var(--overview-muted);
        font-size: 12px;
        line-height: 1.65;
      }

      .health-panel__footer {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding-top: 17px;
        border-top: 1px solid #ececf2;
      }

      .health-panel__footer span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #667085;
        font-size: 10px;
        font-weight: 650;
      }

      .overview-section {
        max-width: 1440px;
        margin: 58px auto 0;
      }

      .overview-section--last {
        margin-bottom: 30px;
      }

      .overview-section-heading {
        margin-bottom: 20px;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
      }

      .overview-section-heading__left {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .overview-section-heading__icon {
        width: 36px;
        height: 36px;
        flex: 0 0 auto;
        display: grid;
        place-items: center;
        margin-top: 2px;
        border: 1px solid #e7e3ff;
        border-radius: 11px;
        background: #f7f5ff;
        color: var(--overview-purple);
      }

      .overview-section-heading h2 {
        margin: 0;
        color: #101828;
        font-size: 22px;
        letter-spacing: -0.025em;
      }

      .overview-section-heading p {
        max-width: 650px;
        margin: 7px 0 0;
        color: var(--overview-muted);
        font-size: 12px;
        line-height: 1.55;
      }

      .overview-focus-grid,
      .overview-intelligence-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .focus-card,
      .intelligence-card {
        position: relative;
        min-height: 230px;
        padding: 25px;
        border: 1px solid var(--overview-border);
        border-radius: 18px;
        background: var(--overview-card);
        box-shadow: 0 7px 24px rgba(16,24,40,0.025);
      }

      .focus-card--change {
        background:
          linear-gradient(
            145deg,
            #ffffff,
            #fafbff
          );
      }

      .focus-card--priority {
        border-color: #e6e0ff;
        background:
          linear-gradient(
            145deg,
            #ffffff,
            #f8f6ff
          );
      }

      .focus-card__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .focus-card__label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #475467;
        font-size: 11px;
        font-weight: 750;
        text-transform: uppercase;
        letter-spacing: 0.07em;
      }

      .focus-card__label svg {
        color: var(--overview-purple);
      }

      .focus-card h3 {
        max-width: 620px;
        margin: 31px 0 10px;
        color: #101828;
        font-size: clamp(19px, 2vw, 25px);
        line-height: 1.25;
        letter-spacing: -0.025em;
      }

      .focus-card > p {
        max-width: 650px;
        margin: 0;
        color: var(--overview-muted);
        font-size: 12px;
        line-height: 1.7;
      }

      .signal-direction,
      .priority-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 8px;
        border-radius: 7px;
        font-size: 10px;
        font-weight: 700;
      }

      .signal-direction--up {
        color: var(--overview-green);
        background: var(--overview-green-soft);
      }

      .signal-direction--down {
        color: var(--overview-red);
        background: var(--overview-red-soft);
      }

      .signal-direction--mixed {
        color: var(--overview-yellow);
        background: var(--overview-yellow-soft);
      }

      .signal-direction--flat,
      .signal-direction--unknown {
        color: #667085;
        background: #f2f4f7;
      }

      .priority-chip {
        color: var(--overview-purple);
        background: var(--overview-purple-soft);
      }

      .expected-impact {
        display: flex;
        align-items: center;
        gap: 9px;
        width: fit-content;
        margin-top: 20px;
        padding: 9px 11px;
        border: 1px solid #dff1e8;
        border-radius: 10px;
        background: #f5fbf8;
        color: var(--overview-green);
      }

      .expected-impact div {
        display: flex;
        flex-direction: column;
        gap: 1px;
      }

      .expected-impact span {
        color: #728078;
        font-size: 9px;
        font-weight: 600;
      }

      .expected-impact strong {
        font-size: 11px;
      }

      .intelligence-card {
        min-height: 250px;
      }

      .intelligence-card--risk {
        background:
          linear-gradient(
            145deg,
            #ffffff 65%,
            #fffafb
          );
      }

      .intelligence-card--opportunity {
        background:
          linear-gradient(
            145deg,
            #ffffff 65%,
            #f9fffc
          );
      }

      .intelligence-card__top {
        display: flex;
        align-items: center;
        gap: 9px;
        color: #475467;
        font-size: 11px;
        font-weight: 750;
        text-transform: uppercase;
        letter-spacing: 0.07em;
      }

      .intelligence-card__icon {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 10px;
        background: #f6f7f9;
        color: #475467;
      }

      .intelligence-card--risk
        .intelligence-card__icon {
        color: var(--overview-red);
        background: var(--overview-red-soft);
      }

      .intelligence-card--opportunity
        .intelligence-card__icon {
        color: var(--overview-green);
        background: var(--overview-green-soft);
      }

      .intelligence-card h3 {
        margin: 24px 0 10px;
        font-size: 20px;
        line-height: 1.3;
        letter-spacing: -0.02em;
      }

      .intelligence-card > p {
        margin: 0;
        color: var(--overview-muted);
        font-size: 12px;
        line-height: 1.7;
      }

      .intelligence-card__footer {
        margin-top: 22px;
      }

      .risk-badge {
        display: inline-flex;
        padding: 5px 8px;
        border-radius: 7px;
        font-size: 10px;
        font-weight: 700;
      }

      .risk-badge--high {
        color: var(--overview-red);
        background: var(--overview-red-soft);
      }

      .risk-badge--medium {
        color: var(--overview-yellow);
        background: var(--overview-yellow-soft);
      }

      .risk-badge--low {
        color: var(--overview-green);
        background: var(--overview-green-soft);
      }

      .risk-badge--unknown {
        color: #667085;
        background: #f2f4f7;
      }

      .text-action {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 0;
        border: 0;
        background: transparent;
        color: var(--overview-purple);
        font-size: 11px;
        font-weight: 750;
        cursor: pointer;
      }

      .text-action:hover {
        text-decoration: underline;
      }

      .personalized-card {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 18px;
        padding: 25px;
        border: 1px solid #e5e0ff;
        border-radius: 18px;
        background:
          linear-gradient(
            115deg,
            #ffffff,
            #f7f4ff
          );
      }

      .personalized-card__icon {
        width: 46px;
        height: 46px;
        display: grid;
        place-items: center;
        border-radius: 14px;
        background: var(--overview-purple);
        color: white;
        box-shadow:
          0 8px 20px rgba(108,76,255,0.18);
      }

      .personalized-card h3 {
        margin: 0;
        font-size: 17px;
        letter-spacing: -0.02em;
      }

      .personalized-card p {
        margin: 6px 0 0;
        color: var(--overview-muted);
        font-size: 11px;
        line-height: 1.6;
      }

      .personalized-card__badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 9px;
        border: 1px solid #e1dcff;
        border-radius: 999px;
        background: rgba(255,255,255,0.7);
        color: #6a54cf;
        font-size: 9px;
        font-weight: 700;
        white-space: nowrap;
      }

      .watchlist-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .watchlist-item {
        min-height: 105px;
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 14px;
        padding: 18px;
        border: 1px solid var(--overview-border);
        border-radius: 15px;
        background: white;
      }

      .watchlist-item__number {
        width: 31px;
        height: 31px;
        display: grid;
        place-items: center;
        border-radius: 9px;
        background: #f5f3ff;
        color: var(--overview-purple);
        font-size: 10px;
        font-weight: 800;
      }

      .watchlist-item h3 {
        margin: 1px 0 5px;
        font-size: 13px;
      }

      .watchlist-item p {
        margin: 0;
        color: var(--overview-muted);
        font-size: 10.5px;
        line-height: 1.6;
      }

      .ask-metria-panel {
        position: relative;
        overflow: hidden;
        display: grid;
        grid-template-columns: minmax(280px, 0.8fr) minmax(360px, 1.2fr);
        gap: 35px;
        padding: 30px;
        border-radius: 21px;
        background:
          linear-gradient(
            125deg,
            #18152a,
            #211a3d 50%,
            #2b2053
          );
        color: white;
        box-shadow:
          0 18px 45px rgba(33,26,61,0.13);
      }

      .ask-metria-panel::after {
        content: "";
        position: absolute;
        width: 300px;
        height: 300px;
        right: -130px;
        bottom: -190px;
        border-radius: 999px;
        background:
          radial-gradient(
            circle,
            rgba(137,108,255,0.34),
            transparent 68%
          );
        pointer-events: none;
      }

      .ask-metria-panel__intro {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: flex-start;
        gap: 15px;
      }

      .ask-metria-panel__icon {
        width: 45px;
        height: 45px;
        flex: 0 0 auto;
        display: grid;
        place-items: center;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 13px;
        background: rgba(255,255,255,0.08);
        color: #b9aaff;
      }

      .ask-metria-panel h2 {
        margin: 0;
        font-size: 21px;
        letter-spacing: -0.025em;
      }

      .ask-metria-panel p {
        margin: 8px 0 0;
        color: #b8b4c8;
        font-size: 11px;
        line-height: 1.65;
      }

      .ask-metria-panel .overview-eyebrow {
        color: #a996ff;
      }

      .suggested-questions {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .suggested-questions button {
        width: 100%;
        min-height: 51px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 11px 14px;
        border: 1px solid rgba(255,255,255,0.09);
        border-radius: 11px;
        background: rgba(255,255,255,0.055);
        color: #f5f3ff;
        font: inherit;
        font-size: 11px;
        font-weight: 600;
        text-align: left;
        cursor: pointer;
        transition:
          background 150ms ease,
          border-color 150ms ease,
          transform 150ms ease;
      }

      .suggested-questions button:hover {
        transform: translateX(2px);
        border-color: rgba(169,150,255,0.34);
        background: rgba(255,255,255,0.09);
      }

      .suggested-questions button svg {
        flex: 0 0 auto;
        color: #a996ff;
      }

      .overview-footer {
        max-width: 1440px;
        margin: 0 auto;
        padding: 18px 2px 0;
        border-top: 1px solid var(--overview-border);
        display: flex;
        justify-content: space-between;
        gap: 20px;
        color: var(--overview-subtle);
        font-size: 9.5px;
      }

      .overview-footer div:first-child {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .overview-footer .overview-live-dot {
        width: 6px;
        height: 6px;
        box-shadow: none;
      }

      .overview-loading,
      .overview-empty,
      .overview-error {
        width: min(680px, 100%);
        min-height: 70vh;
        margin: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .overview-loading__orb,
      .overview-empty__icon,
      .overview-error__icon {
        position: relative;
        width: 68px;
        height: 68px;
        display: grid;
        place-items: center;
        margin-bottom: 23px;
        border-radius: 20px;
        background: var(--overview-purple-soft);
        color: var(--overview-purple);
      }

      .overview-loading__pulse {
        position: absolute;
        inset: -7px;
        border: 1px solid rgba(108,76,255,0.15);
        border-radius: 25px;
        animation: pulseOverview 1.8s ease-in-out infinite;
      }

      .overview-loading h2,
      .overview-empty h1,
      .overview-error h2 {
        margin: 0;
        color: #101828;
        letter-spacing: -0.035em;
      }

      .overview-loading h2,
      .overview-error h2 {
        font-size: 24px;
      }

      .overview-empty h1 {
        max-width: 560px;
        font-size: clamp(30px, 5vw, 46px);
      }

      .overview-loading p,
      .overview-empty > p,
      .overview-error p {
        max-width: 560px;
        margin: 13px 0 25px;
        color: var(--overview-muted);
        font-size: 13px;
        line-height: 1.7;
      }

      .overview-loading__bars {
        display: flex;
        gap: 4px;
        margin-top: 5px;
      }

      .overview-loading__bars span {
        width: 5px;
        height: 18px;
        border-radius: 999px;
        background: var(--overview-purple);
        animation: overviewBars 1s ease-in-out infinite;
      }

      .overview-loading__bars span:nth-child(2) {
        animation-delay: 0.12s;
      }

      .overview-loading__bars span:nth-child(3) {
        animation-delay: 0.24s;
      }

      .overview-empty__visual {
        position: relative;
      }

      .overview-empty__dot {
        position: absolute;
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: #a895ff;
      }

      .overview-empty__dot--1 {
        top: -5px;
        right: -12px;
      }

      .overview-empty__dot--2 {
        bottom: 8px;
        right: -20px;
        opacity: 0.5;
      }

      .overview-empty__dot--3 {
        bottom: -9px;
        left: -12px;
        opacity: 0.3;
      }

      .overview-empty__features {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;
        margin-top: 26px;
      }

      .overview-empty__features span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 9px;
        border: 1px solid var(--overview-border);
        border-radius: 8px;
        background: white;
        color: #667085;
        font-size: 10px;
        font-weight: 600;
      }

      .overview-error__icon {
        background: var(--overview-red-soft);
        color: var(--overview-red);
      }

      .spin {
        animation: spinOverview 0.85s linear infinite;
      }

      @keyframes spinOverview {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes pulseOverview {
        0%,
        100% {
          transform: scale(0.95);
          opacity: 0.35;
        }

        50% {
          transform: scale(1.06);
          opacity: 1;
        }
      }

      @keyframes overviewBars {
        0%,
        100% {
          transform: scaleY(0.5);
          opacity: 0.45;
        }

        50% {
          transform: scaleY(1);
          opacity: 1;
        }
      }

      @media (max-width: 1050px) {
        .metria-overview {
          padding: 30px 25px 40px;
        }

        .overview-hero {
          grid-template-columns: 1fr;
        }

        .overview-hero__side {
          max-width: 600px;
        }

        .ask-metria-panel {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 760px) {
        .metria-overview {
          padding: 24px 16px 35px;
        }

        .overview-topbar {
          align-items: flex-start;
          flex-direction: column;
        }

        .overview-topbar__actions {
          width: 100%;
          justify-content: space-between;
        }

        .overview-freshness {
          flex: 1;
        }

        .overview-hero {
          padding: 26px 20px;
          border-radius: 19px;
        }

        .overview-hero h2 {
          font-size: 32px;
        }

        .overview-focus-grid,
        .overview-intelligence-grid,
        .watchlist-grid {
          grid-template-columns: 1fr;
        }

        .personalized-card {
          grid-template-columns: auto 1fr;
        }

        .personalized-card__badge {
          grid-column: 1 / -1;
          width: fit-content;
        }

        .overview-section {
          margin-top: 43px;
        }

        .overview-section-heading {
          align-items: flex-start;
        }

        .ask-metria-panel {
          padding: 23px 18px;
        }

        .overview-footer {
          flex-direction: column;
          gap: 7px;
        }
      }

      @media (max-width: 500px) {
        .overview-topbar__actions {
          align-items: stretch;
          flex-direction: column;
        }

        .overview-refresh-button {
          justify-content: center;
        }

        .overview-hero__status-row {
          align-items: flex-start;
          flex-direction: column;
        }

        .overview-hero__actions {
          flex-direction: column;
        }

        .overview-primary-button,
        .overview-ghost-button {
          width: 100%;
        }

        .focus-card,
        .intelligence-card {
          padding: 20px;
        }

        .focus-card__header {
          align-items: flex-start;
        }

        .personalized-card {
          grid-template-columns: 1fr;
        }

        .ask-metria-panel__intro {
          flex-direction: column;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          scroll-behavior: auto !important;
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `}</style>
  );
}