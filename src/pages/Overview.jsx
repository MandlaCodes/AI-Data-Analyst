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

const API_BASE_URL =
  "https://ai-data-analyst-backend-1nuw.onrender.com";

/*
  Metria lives inside the Analytics experience.

  Ask Metria therefore DOES NOT navigate to a separate
  /ask-metria page.

  Instead, Overview navigates to Analytics and passes a launch
  request through React Router state.

  Analytics.jsx -> Visualizer.jsx -> MetriaFollowUp.jsx
*/
const ANALYTICS_ROUTE = "/dashboard/analytics";

/* ============================================================
   HELPERS
============================================================ */

const getToken = () =>
  localStorage.getItem("adt_token") ||
  localStorage.getItem("token") ||
  "";

const safeString = (value, fallback = "") => {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const stringValue =
    String(value).trim();

  return stringValue || fallback;
};

const sentenceCase = (value) => {
  const text = safeString(value);

  if (!text) {
    return "";
  }

  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  );
};

const formatGeneratedTime = (value) => {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const diff =
    Date.now() - date.getTime();

  if (diff < 0) {
    return date.toLocaleString();
  }

  const minutes =
    Math.floor(diff / 60000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes === 1) {
    return "1 min ago";
  }

  if (minutes < 60) {
    return `${minutes} mins ago`;
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours === 1) {
    return "1 hour ago";
  }

  if (hours < 24) {
    return `${hours} hours ago`;
  }

  const days =
    Math.floor(hours / 24);

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
};

const getHealthConfig = (status) => {
  switch (
    safeString(status).toLowerCase()
  ) {
    case "strong":
      return {
        label: "Strong",
        className:
          "overview-status overview-status--strong",
        icon: CheckCircle2,
      };

    case "stable":
      return {
        label: "Stable",
        className:
          "overview-status overview-status--stable",
        icon: Activity,
      };

    case "watch":
      return {
        label: "Needs attention",
        className:
          "overview-status overview-status--watch",
        icon: CircleAlert,
      };

    case "critical":
      return {
        label: "Critical",
        className:
          "overview-status overview-status--critical",
        icon: AlertTriangle,
      };

    default:
      return {
        label: "Insufficient signal",
        className:
          "overview-status overview-status--unknown",
        icon: Gauge,
      };
  }
};

const getDirectionConfig = (
  direction
) => {
  switch (
    safeString(direction).toLowerCase()
  ) {
    case "up":
      return {
        label: "Moving up",
        icon: ArrowUpRight,
        className:
          "signal-direction signal-direction--up",
      };

    case "down":
      return {
        label: "Moving down",
        icon: ArrowDownRight,
        className:
          "signal-direction signal-direction--down",
      };

    case "mixed":
      return {
        label: "Mixed movement",
        icon: Activity,
        className:
          "signal-direction signal-direction--mixed",
      };

    case "flat":
      return {
        label: "Mostly flat",
        icon: ArrowRight,
        className:
          "signal-direction signal-direction--flat",
      };

    default:
      return {
        label: "Direction unknown",
        icon: Activity,
        className:
          "signal-direction signal-direction--unknown",
      };
  }
};

const getRiskClass = (severity) => {
  switch (
    safeString(severity).toLowerCase()
  ) {
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

const normaliseQuestions = (
  questions
) => {
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions
    .filter(
      (question) =>
        typeof question === "string"
    )
    .map((question) =>
      question.trim()
    )
    .filter(Boolean)
    .slice(0, 3);
};

const normaliseWatchlist = (
  watchlist
) => {
  if (!Array.isArray(watchlist)) {
    return [];
  }

  return watchlist
    .filter(
      (item) =>
        item &&
        typeof item === "object"
    )
    .slice(0, 4);
};

/*
  Generates a unique launch ID every time Overview opens Metria.

  This matters because the same suggested question may be clicked
  more than once. MetriaFollowUp can use this ID to distinguish
  one launch request from another.
*/
const createMetriaLaunchId = () => {
  return `overview-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
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
            <Icon
              size={17}
              strokeWidth={2}
            />
          </div>
        ) : null}

        <div>
          {eyebrow ? (
            <div className="overview-eyebrow">
              {eyebrow}
            </div>
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
          <Icon
            size={18}
            strokeWidth={2}
          />
        </div>

        <span>{eyebrow}</span>
      </div>

      <h3>
        {title ||
          "Not enough information yet"}
      </h3>

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
        <Brain
          size={30}
          strokeWidth={1.8}
        />

        <span className="overview-loading__pulse" />
      </div>

      <h2>
        Metria is reading your business
      </h2>

      <p>
        Reviewing your latest analysis,
        business signals and relevant Ask
        Metria context.
      </p>

      <div className="overview-loading__bars">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function EmptyOverview({
  onOpenAnalytics,
}) {
  return (
    <div className="overview-empty">
      <div className="overview-empty__visual">
        <div className="overview-empty__icon">
          <BarChart3
            size={32}
            strokeWidth={1.8}
          />
        </div>

        <span className="overview-empty__dot overview-empty__dot--1" />
        <span className="overview-empty__dot overview-empty__dot--2" />
        <span className="overview-empty__dot overview-empty__dot--3" />
      </div>

      <div className="overview-eyebrow">
        Your business operating system
      </div>

      <h1>
        Give Metria something to watch.
      </h1>

      <p>
        Once you analyse business data,
        your Overview becomes a living
        executive briefing — showing what
        changed, what matters, what needs
        attention and what to do next.
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

function ErrorOverview({
  message,
  onRetry,
}) {
  return (
    <div className="overview-error">
      <div className="overview-error__icon">
        <AlertTriangle size={27} />
      </div>

      <h2>
        Metria couldn't load your overview
      </h2>

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

  const [
    overview,
    setOverview,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* ==========================================================
     FETCH OVERVIEW
  ========================================================== */

  const fetchOverview = useCallback(
    async ({
      force = false,
    } = {}) => {
      const token = getToken();

      if (!token) {
        setError(
          "Your session has expired. Please sign in again."
        );

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
          `${API_BASE_URL}/overview/intelligence`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              force,
            }),
          }
        );

        let data = null;

        try {
          data =
            await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          if (
            response.status === 401
          ) {
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

  /* ==========================================================
     DERIVED OVERVIEW STATE
  ========================================================== */

  const brief =
    overview?.brief || null;

  const healthConfig = useMemo(
    () =>
      getHealthConfig(
        brief?.health?.status
      ),
    [brief?.health?.status]
  );

  const directionConfig = useMemo(
    () =>
      getDirectionConfig(
        brief?.change?.direction
      ),
    [brief?.change?.direction]
  );

  const questions = useMemo(
    () =>
      normaliseQuestions(
        brief?.suggested_questions
      ),
    [brief?.suggested_questions]
  );

  const watchlist = useMemo(
    () =>
      normaliseWatchlist(
        brief?.watchlist
      ),
    [brief?.watchlist]
  );

  const HealthIcon =
    healthConfig.icon;

  const DirectionIcon =
    directionConfig.icon;

  const organization =
    safeString(
      brief?.meta?.organization
    ) || "Your business";

  const industry =
    safeString(
      brief?.meta?.industry
    ) || "Business";

  const datasetCount =
    Number(
      brief?.meta?.dataset_count
    ) || 0;

  const confidence =
    typeof brief?.confidence ===
    "number"
      ? brief.confidence
      : null;

  /* ==========================================================
     NAVIGATION
  ========================================================== */

  /*
    Normal Analytics navigation.

    This does NOT ask Metria to expand.
  */
  const openAnalytics = () => {
    navigate(ANALYTICS_ROUTE);
  };

  /*
    OVERVIEW -> ANALYTICS -> FULL-SCREEN METRIA

    This is the important connection.

    Analytics.jsx reads:

      location.state?.source
      location.state?.openMetria
      location.state?.initialQuestion
      location.state?.requestId

    It then passes those through:

      Analytics
          ↓
      Visualizer
          ↓
      MetriaFollowUp

    MetriaFollowUp sets its EXISTING isExpanded state to true.
  */
  const openAskMetria = (
    question = ""
  ) => {
    const cleanQuestion =
      typeof question === "string"
        ? question.trim()
        : "";

    navigate(
      ANALYTICS_ROUTE,
      {
        state: {
          source: "overview",

          /*
            Tells the existing Metria
            component to enter its
            full-screen state.
          */
          openMetria: true,

          /*
            Optional question supplied by
            an Overview recommendation.
          */
          initialQuestion:
            cleanQuestion,

          /*
            Unique ID means two clicks on
            the same question are still
            treated as separate launches.
          */
          requestId:
            createMetriaLaunchId(),
        },
      }
    );
  };

  /* ==========================================================
     LOADING
  ========================================================== */

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

  /* ==========================================================
     ERROR
  ========================================================== */

  if (
    error &&
    !overview
  ) {
    return (
      <>
        <OverviewStyles />

        <main className="metria-overview">
          <ErrorOverview
            message={error}
            onRetry={() =>
              fetchOverview()
            }
          />
        </main>
      </>
    );
  }

  /* ==========================================================
     EMPTY STATE
  ========================================================== */

  if (
    !overview?.has_data ||
    overview?.status ===
      "empty" ||
    !brief
  ) {
    return (
      <>
        <OverviewStyles />

        <main className="metria-overview">
          <EmptyOverview
            onOpenAnalytics={
              openAnalytics
            }
          />
        </main>
      </>
    );
  }

  /* ==========================================================
     MAIN OVERVIEW
  ========================================================== */

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
                <span>
                  Business intelligence
                </span>

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
                  refreshing
                    ? "spin"
                    : ""
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
            <AlertTriangle
              size={15}
            />

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
              <div
                className={
                  healthConfig.className
                }
              >
                <HealthIcon
                  size={15}
                />

                {brief?.health
                  ?.label ||
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
                onClick={() =>
                  openAskMetria()
                }
              >
                <MessageSquareText
                  size={17}
                />

                Ask Metria

                <ArrowRight
                  size={16}
                />
              </button>

              <button
                type="button"
                className="overview-ghost-button"
                onClick={
                  openAnalytics
                }
              >
                <BarChart3
                  size={16}
                />

                Open analytics
              </button>
            </div>
          </div>

          <div className="overview-hero__side">
            <div className="health-panel">
              <div className="health-panel__top">
                <span>
                  Business health
                </span>

                <Activity
                  size={17}
                />
              </div>

              <div className="health-panel__status">
                {brief?.health
                  ?.label ||
                  healthConfig.label}
              </div>

              <p>
                {brief?.health
                  ?.reason ||
                  "Metria does not yet have enough evidence to explain the current health state."}
              </p>

              <div className="health-panel__footer">
                <span>
                  <Database
                    size={14}
                  />

                  {datasetCount}{" "}
                  {datasetCount === 1
                    ? "dataset"
                    : "datasets"}
                </span>

                {confidence !==
                null ? (
                  <span>
                    <Gauge
                      size={14}
                    />

                    {confidence <= 1
                      ? `${Math.round(
                          confidence *
                            100
                        )}% confidence`
                      : `${Math.round(
                          confidence
                        )}% confidence`}
                  </span>
                ) : (
                  <span>
                    <Brain
                      size={14}
                    />

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
                  <Activity
                    size={17}
                  />

                  Biggest change
                </div>

                <div
                  className={
                    directionConfig.className
                  }
                >
                  <DirectionIcon
                    size={14}
                  />

                  {
                    directionConfig.label
                  }
                </div>
              </div>

              <h3>
                {brief?.change
                  ?.headline ||
                  "No reliable change detected yet"}
              </h3>

              <p>
                {brief?.change
                  ?.detail ||
                  "Metria needs more historical analytical evidence before identifying a meaningful change."}
              </p>
            </article>

            <article className="focus-card focus-card--priority">
              <div className="focus-card__header">
                <div className="focus-card__label">
                  <Target
                    size={17}
                  />

                  Priority
                </div>

                <span className="priority-chip">
                  Do next
                </span>
              </div>

              <h3>
                {brief?.priority
                  ?.title ||
                  "Continue building business signal"}
              </h3>

              <p>
                {brief?.priority
                  ?.reason ||
                  "Metria needs more evidence before recommending a specific business action."}
              </p>

              {brief?.priority
                ?.expected_impact ? (
                <div className="expected-impact">
                  <TrendingUp
                    size={15}
                  />

                  <div>
                    <span>
                      Expected impact
                    </span>

                    <strong>
                      {
                        brief
                          .priority
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
              icon={
                ShieldAlert
              }
              eyebrow="Risk to watch"
              title={
                brief?.risk?.title
              }
              body={
                brief?.risk?.detail
              }
              tone="risk"
              footer={
                <span
                  className={getRiskClass(
                    brief?.risk
                      ?.severity
                  )}
                >
                  {sentenceCase(
                    brief?.risk
                      ?.severity ||
                      "unknown"
                  )}{" "}
                  severity
                </span>
              }
            />

            <IntelligenceCard
              icon={Lightbulb}
              eyebrow="Opportunity"
              title={
                brief?.opportunity
                  ?.title
              }
              body={
                brief?.opportunity
                  ?.detail
              }
              tone="opportunity"
              footer={
                <button
                  type="button"
                  className="text-action"
                  onClick={() =>
                    openAskMetria(
                      brief
                        ?.opportunity
                        ?.title
                        ? `Investigate this opportunity further: ${brief.opportunity.title}`
                        : "What is the strongest opportunity in my current business data?"
                    )
                  }
                >
                  Investigate with
                  Metria

                  <ChevronRight
                    size={15}
                  />
                </button>
              }
            />
          </div>
        </section>

        {/* ====================================================
            PERSONALIZATION
        ==================================================== */}

        {brief?.personalization
          ?.focus ? (
          <section className="overview-section">
            <div className="personalized-card">
              <div className="personalized-card__icon">
                <Sparkles
                  size={20}
                />
              </div>

              <div className="personalized-card__content">
                <div className="overview-eyebrow">
                  Personalized for
                  you
                </div>

                <h3>
                  {
                    brief
                      .personalization
                      .focus
                  }
                </h3>

                {brief
                  ?.personalization
                  ?.reason ? (
                  <p>
                    {
                      brief
                        .personalization
                        .reason
                    }
                  </p>
                ) : null}
              </div>

              <div className="personalized-card__badge">
                <Brain
                  size={14}
                />

                Learned from your
                Metria usage
              </div>
            </div>
          </section>
        ) : null}

        {/* ====================================================
            WATCHLIST
        ==================================================== */}

        {watchlist.length >
        0 ? (
          <section className="overview-section">
            <SectionHeading
              eyebrow="Always watching"
              title="Metria watchlist"
              description="Signals worth keeping an eye on as your business data evolves."
              icon={Activity}
            />

            <div className="watchlist-grid">
              {watchlist.map(
                (
                  item,
                  index
                ) => (
                  <article
                    className="watchlist-item"
                    key={`${
                      item?.label ||
                      "watch"
                    }-${index}`}
                  >
                    <div className="watchlist-item__number">
                      {String(
                        index + 1
                      ).padStart(
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
                )
              )}
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
                  strokeWidth={
                    1.9
                  }
                />
              </div>

              <div>
                <div className="overview-eyebrow">
                  Go deeper
                </div>

                <h2>
                  Ask Metria about
                  this.
                </h2>

                <p>
                  Your analyst
                  already has context
                  from the business
                  intelligence above.
                  Continue the
                  investigation
                  instead of starting
                  from scratch.
                </p>
              </div>
            </div>

            {questions.length >
            0 ? (
              <div className="suggested-questions">
                {questions.map(
                  (
                    question,
                    index
                  ) => (
                    <button
                      type="button"
                      key={`${question}-${index}`}
                      onClick={() =>
                        openAskMetria(
                          question
                        )
                      }
                    >
                      <span>
                        {question}
                      </span>

                      <ArrowRight
                        size={
                          16
                        }
                      />
                    </button>
                  )
                )}
              </div>
            ) : (
              <button
                type="button"
                className="overview-primary-button"
                onClick={() =>
                  openAskMetria()
                }
              >
                <MessageSquareText
                  size={17}
                />

                Open Ask Metria

                <ArrowRight
                  size={16}
                />
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
            Metria intelligence
            active
          </div>

          <div>
            {datasetCount}{" "}
            {datasetCount === 1
              ? "dataset"
              : "datasets"}{" "}
            connected to this
            briefing
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
        --overview-bg: #c7a7e4;
        --overview-card: #ffffff;

        /* MUCH STRONGER TEXT CONTRAST */
        --overview-text: #111827;
        --overview-heading: #0f172a;
        --overview-body: #475467;
        --overview-muted: #667085;
        --overview-subtle: #7b8494;

        --overview-border: #e4e7ec;
        --overview-border-strong: #d9dde5;

        --overview-purple: #6941c6;
        --overview-purple-bright: #7357f6;
        --overview-purple-dark: #53389e;
        --overview-purple-soft: #f4f0ff;

        --overview-green: #067647;
        --overview-green-soft: #ecfdf3;

        --overview-yellow: #b54708;
        --overview-yellow-soft: #fffaeb;

        --overview-red: #b42318;
        --overview-red-soft: #fef3f2;

        --overview-blue: #175cd3;
        --overview-blue-soft: #eff8ff;

        --overview-shadow:
          0 1px 2px rgba(16, 24, 40, 0.03),
          0 12px 32px rgba(16, 24, 40, 0.045);

        --overview-shadow-lg:
          0 2px 5px rgba(16, 24, 40, 0.03),
          0 24px 60px rgba(56, 45, 105, 0.08);
      }

      * {
        box-sizing: border-box;
      }

        .metria-overview {
          width: 100%;
          min-height: 100%;
          padding: 42px 46px 56px;

        background:
          radial-gradient(
            circle at 72% -5%,
            rgba(105, 65, 198, 0.07),
            transparent 29%
          ),
          linear-gradient(
            180deg,
            #fafaff 0px,
            var(--overview-bg) 420px
          );

        color: var(--overview-text);

        font-family:
          Inter,
          ui-sans-serif,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;

        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }

      /* =========================================================
         SHARED TYPOGRAPHY
      ========================================================= */

      .overview-eyebrow {
        margin-bottom: 8px;
        color: var(--overview-purple);
        font-size: 12px;
        line-height: 1.3;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      /* =========================================================
         TOP BAR
      ========================================================= */

      .overview-topbar {
        width: 100%;
        max-width: 1440px;
        margin: 0 auto 30px;

        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
      }

      .overview-topbar h1 {
        margin: 0;

        color: var(--overview-heading);

        font-size: clamp(32px, 3vw, 42px);
        line-height: 1.05;
        font-weight: 800;
        letter-spacing: -0.045em;
      }

      .overview-topbar__actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .overview-freshness {
        min-height: 48px;

        display: flex;
        align-items: center;
        gap: 11px;

        padding: 9px 14px;

        border: 1px solid var(--overview-border);
        border-radius: 13px;

        background: rgba(255, 255, 255, 0.9);

        box-shadow:
          0 1px 2px rgba(16, 24, 40, 0.02);
      }

      .overview-freshness div {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .overview-freshness span {
        color: var(--overview-muted);
        font-size: 11px;
        line-height: 1.3;
        font-weight: 600;
      }

      .overview-freshness strong {
        color: #344054;
        font-size: 12px;
        line-height: 1.35;
        font-weight: 700;
      }

      .overview-live-dot {
        width: 8px;
        height: 8px;
        flex: 0 0 auto;

        border-radius: 999px;

        background: #12b76a;

        box-shadow:
          0 0 0 4px rgba(18, 183, 106, 0.1);
      }

      /* =========================================================
         BUTTON SYSTEM
      ========================================================= */

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
        height: 48px;

        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;

        padding: 0 17px;

        border: 1px solid var(--overview-border);
        border-radius: 13px;

        background: #ffffff;
        color: #344054;

        font-size: 13px;
        font-weight: 700;
      }

      .overview-refresh-button:hover:not(:disabled),
      .overview-secondary-button:hover,
      .overview-ghost-button:hover {
        border-color: #cfd4dc;
        background: #f9fafb;
      }

      .overview-refresh-button:disabled {
        cursor: wait;
        opacity: 0.65;
      }

      .overview-primary-button {
        min-height: 48px;

        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;

        padding: 0 19px;

        border-radius: 13px;

        background:
          linear-gradient(
            135deg,
            #6941c6,
            #7f56d9
          );

        color: #ffffff;

        box-shadow:
          0 8px 20px rgba(105, 65, 198, 0.22);

        font-size: 13px;
        line-height: 1;
        font-weight: 750;
      }

      .overview-primary-button:hover {
        transform: translateY(-1px);

        box-shadow:
          0 12px 28px rgba(105, 65, 198, 0.27);
      }

      .overview-ghost-button,
      .overview-secondary-button {
        min-height: 48px;

        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;

        padding: 0 18px;

        border: 1px solid var(--overview-border);
        border-radius: 13px;

        background: #ffffff;
        color: #344054;

        font-size: 13px;
        font-weight: 700;
      }

      /* keyboard accessibility */

      .overview-primary-button:focus-visible,
      .overview-ghost-button:focus-visible,
      .overview-secondary-button:focus-visible,
      .overview-refresh-button:focus-visible,
      .suggested-questions button:focus-visible,
      .text-action:focus-visible {
        outline: 3px solid rgba(105, 65, 198, 0.2);
        outline-offset: 3px;
      }

      /* =========================================================
         ERROR
      ========================================================= */

      .overview-inline-error {
        max-width: 1440px;
        margin: -10px auto 20px;

        display: flex;
        align-items: center;
        gap: 9px;

        padding: 12px 14px;

        border: 1px solid #fecdca;
        border-radius: 11px;

        background: #fef3f2;
        color: #b42318;

        font-size: 13px;
        line-height: 1.5;
        font-weight: 600;
      }

      /* =========================================================
         EXECUTIVE HERO
      ========================================================= */

      .overview-hero {
        position: relative;

        width: 100%;
        max-width: 1440px;
        min-height: 420px;

        margin: 0 auto;

        overflow: hidden;

        display: grid;
        grid-template-columns:
          minmax(0, 1.42fr)
          minmax(330px, 0.58fr);

        gap: clamp(32px, 4vw, 58px);

        padding:
          clamp(38px, 4.5vw, 62px)
          clamp(34px, 4.8vw, 68px);

        border: 1px solid #e4dfff;
        border-radius: 28px;

        background:
          linear-gradient(
            125deg,
            #ffffff 0%,
            #fdfcff 45%,
            #f4f1ff 100%
          );

        box-shadow: var(--overview-shadow-lg);
      }

      .overview-hero__glow {
        position: absolute;

        width: 520px;
        height: 520px;

        right: -190px;
        top: -260px;

        border-radius: 999px;

        background:
          radial-gradient(
            circle,
            rgba(105, 65, 198, 0.19),
            rgba(105, 65, 198, 0)
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

        margin-bottom: 24px;
      }

      .overview-company-pill {
        padding: 7px 11px;

        border: 1px solid #ddd6fe;
        border-radius: 999px;

        background: rgba(255,255,255,0.9);

        color: #5b3cc4;

        font-size: 12px;
        line-height: 1;
        font-weight: 750;
      }

      .overview-industry {
        color: #667085;

        font-size: 12px;
        font-weight: 600;
      }

      .overview-hero__status-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;

        gap: 13px;

        margin-bottom: 17px;
      }

      .overview-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;

        padding: 7px 10px;

        border-radius: 9px;

        font-size: 12px;
        line-height: 1;
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
        color: #475467;
      }

      .overview-hero__timestamp {
        display: inline-flex;
        align-items: center;
        gap: 6px;

        color: #667085;

        font-size: 11px;
        font-weight: 600;
      }

      .overview-hero h2 {
        max-width: 840px;

        margin: 0;

        color: var(--overview-heading);

        font-size: clamp(36px, 4vw, 54px);
        line-height: 1.06;
        font-weight: 800;
        letter-spacing: -0.05em;
      }

      /*
        THIS IS ONE OF THE BIGGEST READABILITY
        IMPROVEMENTS IN THE WHOLE PAGE.
      */

      .overview-hero__brief {
        max-width: 760px;

        margin: 22px 0 0;

        color: #475467;

        font-size: clamp(16px, 1.25vw, 18px);
        line-height: 1.72;
        font-weight: 450;

        text-wrap: pretty;
      }

      .overview-hero__actions {
        display: flex;
        flex-wrap: wrap;

        gap: 11px;

        margin-top: 31px;
      }

      .overview-hero__side {
        display: flex;
        align-items: center;
      }

      /* =========================================================
         HEALTH PANEL
      ========================================================= */

      .health-panel {
        width: 100%;

        padding: 27px;

        border: 1px solid rgba(255,255,255,0.96);
        border-radius: 21px;

        background: rgba(255,255,255,0.84);

        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);

        box-shadow:
          0 18px 50px rgba(74,56,160,0.1);
      }

      .health-panel__top {
        display: flex;
        align-items: center;
        justify-content: space-between;

        color: var(--overview-purple);

        font-size: 12px;
        line-height: 1.3;
        font-weight: 800;

        text-transform: uppercase;
        letter-spacing: 0.07em;
      }

      .health-panel__status {
        margin-top: 25px;

        color: var(--overview-heading);

        font-size: clamp(28px, 3vw, 38px);
        line-height: 1.08;
        font-weight: 800;
        letter-spacing: -0.04em;
      }

      .health-panel > p {
        min-height: 58px;

        margin: 13px 0 25px;

        color: #475467;

        font-size: 14px;
        line-height: 1.7;
        font-weight: 450;

        text-wrap: pretty;
      }

      .health-panel__footer {
        display: flex;
        flex-wrap: wrap;

        gap: 10px;

        padding-top: 18px;

        border-top: 1px solid #e7e9ee;
      }

      .health-panel__footer span {
        display: inline-flex;
        align-items: center;
        gap: 6px;

        color: #5d6675;

        font-size: 11px;
        line-height: 1.4;
        font-weight: 650;
      }

      /* =========================================================
         SECTIONS
      ========================================================= */

      .overview-section {
        width: 100%;
        max-width: 1440px;

        margin: 64px auto 0;
      }

      .overview-section--last {
        margin-bottom: 34px;
      }

      .overview-section-heading {
        margin-bottom: 23px;

        display: flex;
        align-items: flex-end;
        justify-content: space-between;

        gap: 24px;
      }

      .overview-section-heading__left {
        display: flex;
        align-items: flex-start;

        gap: 14px;
      }

      .overview-section-heading__icon {
        width: 40px;
        height: 40px;

        flex: 0 0 auto;

        display: grid;
        place-items: center;

        margin-top: 1px;

        border: 1px solid #e4dfff;
        border-radius: 12px;

        background: #f6f3ff;
        color: var(--overview-purple);
      }

      .overview-section-heading h2 {
        margin: 0;

        color: var(--overview-heading);

        font-size: clamp(23px, 2vw, 27px);
        line-height: 1.2;
        font-weight: 780;
        letter-spacing: -0.03em;
      }

      .overview-section-heading p {
        max-width: 700px;

        margin: 8px 0 0;

        color: #5d6675;

        font-size: 14px;
        line-height: 1.65;
        font-weight: 450;

        text-wrap: pretty;
      }

      /* =========================================================
         MAIN CARD GRIDS
      ========================================================= */

      .overview-focus-grid,
      .overview-intelligence-grid {
        display: grid;

        grid-template-columns:
          repeat(2, minmax(0, 1fr));

        gap: 18px;
      }

      .focus-card,
      .intelligence-card {
        position: relative;

        min-height: 255px;

        padding: 29px;

        border: 1px solid var(--overview-border);
        border-radius: 20px;

        background: var(--overview-card);

        box-shadow:
          0 1px 2px rgba(16,24,40,0.02),
          0 8px 28px rgba(16,24,40,0.035);

        transition:
          transform 180ms ease,
          box-shadow 180ms ease,
          border-color 180ms ease;
      }

      .focus-card:hover,
      .intelligence-card:hover {
        transform: translateY(-2px);

        border-color: #d9d5eb;

        box-shadow:
          0 2px 4px rgba(16,24,40,0.025),
          0 14px 38px rgba(16,24,40,0.055);
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
        border-color: #e4dfff;

        background:
          linear-gradient(
            145deg,
            #ffffff,
            #f9f7ff
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

        font-size: 12px;
        line-height: 1.3;
        font-weight: 800;

        text-transform: uppercase;
        letter-spacing: 0.065em;
      }

      .focus-card__label svg {
        color: var(--overview-purple);
      }

      .focus-card h3 {
        max-width: 640px;

        margin: 31px 0 12px;

        color: var(--overview-heading);

        font-size: clamp(21px, 2vw, 27px);
        line-height: 1.28;
        font-weight: 760;
        letter-spacing: -0.03em;

        text-wrap: balance;
      }

      .focus-card > p {
        max-width: 680px;

        margin: 0;

        color: #475467;

        font-size: 15px;
        line-height: 1.72;
        font-weight: 450;

        text-wrap: pretty;
      }

      .signal-direction,
      .priority-chip {
        display: inline-flex;
        align-items: center;

        gap: 5px;

        padding: 6px 9px;

        border-radius: 8px;

        font-size: 11px;
        line-height: 1.2;
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
        color: #475467;
        background: #f2f4f7;
      }

      .priority-chip {
        color: var(--overview-purple-dark);
        background: var(--overview-purple-soft);
      }

      .expected-impact {
        display: flex;
        align-items: center;

        gap: 10px;

        width: fit-content;

        margin-top: 23px;
        padding: 10px 12px;

        border: 1px solid #d1fadf;
        border-radius: 11px;

        background: #f0fdf4;
        color: var(--overview-green);
      }

      .expected-impact div {
        display: flex;
        flex-direction: column;

        gap: 2px;
      }

      .expected-impact span {
        color: #667085;

        font-size: 10px;
        line-height: 1.3;
        font-weight: 650;
      }

      .expected-impact strong {
        font-size: 12px;
        line-height: 1.4;
        font-weight: 750;
      }

      /* =========================================================
         RISK / OPPORTUNITY
      ========================================================= */

      .intelligence-card {
        min-height: 280px;
      }

      .intelligence-card--risk {
        background:
          linear-gradient(
            145deg,
            #ffffff 60%,
            #fffafa
          );
      }

      .intelligence-card--opportunity {
        background:
          linear-gradient(
            145deg,
            #ffffff 60%,
            #f8fffb
          );
      }

      .intelligence-card__top {
        display: flex;
        align-items: center;

        gap: 10px;

        color: #475467;

        font-size: 12px;
        line-height: 1.3;
        font-weight: 800;

        text-transform: uppercase;
        letter-spacing: 0.065em;
      }

      .intelligence-card__icon {
        width: 38px;
        height: 38px;

        display: grid;
        place-items: center;

        border-radius: 11px;

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
        margin: 25px 0 12px;

        color: var(--overview-heading);

        font-size: clamp(20px, 2vw, 24px);
        line-height: 1.3;
        font-weight: 760;
        letter-spacing: -0.025em;

        text-wrap: balance;
      }

      .intelligence-card > p {
        max-width: 680px;

        margin: 0;

        color: #475467;

        font-size: 15px;
        line-height: 1.72;
        font-weight: 450;

        text-wrap: pretty;
      }

      .intelligence-card__footer {
        margin-top: 24px;
      }

      .risk-badge {
        display: inline-flex;

        padding: 6px 9px;

        border-radius: 8px;

        font-size: 11px;
        line-height: 1.2;
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
        color: #475467;
        background: #f2f4f7;
      }

      .text-action {
        display: inline-flex;
        align-items: center;

        gap: 5px;

        padding: 0;

        border: 0;

        background: transparent;
        color: var(--overview-purple-dark);

        font-size: 13px;
        line-height: 1.4;
        font-weight: 750;

        cursor: pointer;
      }

      .text-action:hover {
        text-decoration: underline;
      }

      /* =========================================================
         PERSONALIZATION
      ========================================================= */

      .personalized-card {
        display: grid;

        grid-template-columns:
          auto minmax(0, 1fr) auto;

        align-items: center;

        gap: 20px;

        padding: 28px;

        border: 1px solid #e4dfff;
        border-radius: 20px;

        background:
          linear-gradient(
            115deg,
            #ffffff,
            #f8f5ff
          );

        box-shadow:
          0 8px 28px rgba(61, 46, 122, 0.035);
      }

      .personalized-card__icon {
        width: 50px;
        height: 50px;

        display: grid;
        place-items: center;

        border-radius: 15px;

        background:
          linear-gradient(
            135deg,
            #6941c6,
            #7f56d9
          );

        color: white;

        box-shadow:
          0 9px 22px rgba(105,65,198,0.2);
      }

      .personalized-card h3 {
        margin: 0;

        color: var(--overview-heading);

        font-size: 19px;
        line-height: 1.35;
        font-weight: 750;
        letter-spacing: -0.02em;
      }

      .personalized-card p {
        max-width: 850px;

        margin: 7px 0 0;

        color: #475467;

        font-size: 14px;
        line-height: 1.65;
        font-weight: 450;

        text-wrap: pretty;
      }

      .personalized-card__badge {
        display: inline-flex;
        align-items: center;

        gap: 6px;

        padding: 8px 11px;

        border: 1px solid #ddd6fe;
        border-radius: 999px;

        background: rgba(255,255,255,0.85);
        color: #5b3cc4;

        font-size: 10px;
        line-height: 1.3;
        font-weight: 700;

        white-space: nowrap;
      }

      /* =========================================================
         WATCHLIST
      ========================================================= */

      .watchlist-grid {
        display: grid;

        grid-template-columns:
          repeat(2, minmax(0, 1fr));

        gap: 14px;
      }

      .watchlist-item {
        min-height: 125px;

        display: grid;

        grid-template-columns:
          auto 1fr;

        gap: 16px;

        padding: 22px;

        border: 1px solid var(--overview-border);
        border-radius: 17px;

        background: #ffffff;

        box-shadow:
          0 5px 20px rgba(16,24,40,0.025);

        transition:
          transform 180ms ease,
          border-color 180ms ease,
          box-shadow 180ms ease;
      }

      .watchlist-item:hover {
        transform: translateY(-1px);

        border-color: #d9d5eb;

        box-shadow:
          0 10px 28px rgba(16,24,40,0.045);
      }

      .watchlist-item__number {
        width: 34px;
        height: 34px;

        display: grid;
        place-items: center;

        border-radius: 10px;

        background: #f4f0ff;
        color: var(--overview-purple-dark);

        font-size: 11px;
        font-weight: 800;
      }

      .watchlist-item h3 {
        margin: 1px 0 7px;

        color: var(--overview-heading);

        font-size: 15px;
        line-height: 1.35;
        font-weight: 750;
      }

      .watchlist-item p {
        max-width: 620px;

        margin: 0;

        color: #475467;

        font-size: 13px;
        line-height: 1.65;
        font-weight: 450;

        text-wrap: pretty;
      }

      /* =========================================================
         ASK METRIA
      ========================================================= */

      .ask-metria-panel {
        position: relative;

        overflow: hidden;

        display: grid;

        grid-template-columns:
          minmax(300px, 0.78fr)
          minmax(400px, 1.22fr);

        align-items: center;

        gap: clamp(36px, 5vw, 70px);

        padding: clamp(32px, 4vw, 48px);

        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 24px;

        background:
          radial-gradient(
            circle at 90% 10%,
            rgba(127,86,217,0.22),
            transparent 32%
          ),
          linear-gradient(
            125deg,
            #161322,
            #211a38 52%,
            #2b2050
          );

        color: #ffffff;

        box-shadow:
          0 22px 55px rgba(33,26,61,0.16);
      }

      .ask-metria-panel::after {
        content: "";

        position: absolute;

        width: 360px;
        height: 360px;

        right: -150px;
        bottom: -220px;

        border-radius: 999px;

        background:
          radial-gradient(
            circle,
            rgba(137,108,255,0.36),
            transparent 68%
          );

        pointer-events: none;
      }

      .ask-metria-panel__intro {
        position: relative;
        z-index: 1;

        display: flex;
        align-items: flex-start;

        gap: 17px;
      }

      .ask-metria-panel__icon {
        width: 50px;
        height: 50px;

        flex: 0 0 auto;

        display: grid;
        place-items: center;

        border: 1px solid rgba(255,255,255,0.13);
        border-radius: 15px;

        background: rgba(255,255,255,0.08);
        color: #c4b5fd;
      }

      .ask-metria-panel h2 {
        margin: 0;

        color: #ffffff;

        font-size: clamp(24px, 2.2vw, 30px);
        line-height: 1.2;
        font-weight: 760;
        letter-spacing: -0.03em;
      }

      .ask-metria-panel p {
        max-width: 470px;

        margin: 11px 0 0;

        /*
          MUCH brighter than the original.
          This is supposed to be READ.
        */
        color: #d0cddd;

        font-size: 14px;
        line-height: 1.72;
        font-weight: 450;

        text-wrap: pretty;
      }

      .ask-metria-panel .overview-eyebrow {
        color: #b9a7ff;
      }

      .suggested-questions {
        position: relative;
        z-index: 1;

        display: flex;
        flex-direction: column;

        gap: 10px;
      }

      .suggested-questions button {
        width: 100%;
        min-height: 62px;

        display: flex;
        align-items: center;
        justify-content: space-between;

        gap: 18px;

        padding: 14px 17px;

        border: 1px solid rgba(255,255,255,0.11);
        border-radius: 13px;

        background: rgba(255,255,255,0.07);

        color: #f8f7ff;

        font: inherit;

        font-size: 13px;
        line-height: 1.5;
        font-weight: 600;

        text-align: left;

        cursor: pointer;

        transition:
          background 150ms ease,
          border-color 150ms ease,
          transform 150ms ease;
      }

      .suggested-questions button:hover {
        transform: translateX(3px);

        border-color: rgba(185,167,255,0.4);

        background: rgba(255,255,255,0.11);
      }

      .suggested-questions button svg {
        flex: 0 0 auto;
        color: #b9a7ff;
      }

      /* =========================================================
         FOOTER
      ========================================================= */

      .overview-footer {
        width: 100%;
        max-width: 1440px;

        margin: 0 auto;
        padding: 20px 2px 0;

        border-top: 1px solid var(--overview-border);

        display: flex;
        justify-content: space-between;

        gap: 20px;

        color: #7b8494;

        font-size: 11px;
        line-height: 1.5;
        font-weight: 550;
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

      /* =========================================================
         LOADING / EMPTY / ERROR
      ========================================================= */

      .overview-loading,
      .overview-empty,
      .overview-error {
        width: min(700px, 100%);
        min-height: 70vh;

        margin: auto;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        padding: 30px 20px;

        text-align: center;
      }

      .overview-loading__orb,
      .overview-empty__icon,
      .overview-error__icon {
        position: relative;

        width: 72px;
        height: 72px;

        display: grid;
        place-items: center;

        margin-bottom: 25px;

        border-radius: 21px;

        background: var(--overview-purple-soft);
        color: var(--overview-purple);
      }

      .overview-loading__pulse {
        position: absolute;

        inset: -7px;

        border: 1px solid rgba(105,65,198,0.16);
        border-radius: 26px;

        animation:
          pulseOverview
          1.8s
          ease-in-out
          infinite;
      }

      .overview-loading h2,
      .overview-empty h1,
      .overview-error h2 {
        margin: 0;

        color: var(--overview-heading);

        font-weight: 780;
        letter-spacing: -0.035em;
      }

      .overview-loading h2,
      .overview-error h2 {
        font-size: 27px;
      }

      .overview-empty h1 {
        max-width: 580px;

        font-size:
          clamp(34px, 5vw, 50px);

        line-height: 1.08;
      }

      .overview-loading p,
      .overview-empty > p,
      .overview-error p {
        max-width: 580px;

        margin: 15px 0 27px;

        color: #475467;

        font-size: 15px;
        line-height: 1.72;
        font-weight: 450;
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

        animation:
          overviewBars
          1s
          ease-in-out
          infinite;
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

        gap: 9px;

        margin-top: 28px;
      }

      .overview-empty__features span {
        display: inline-flex;
        align-items: center;

        gap: 6px;

        padding: 8px 11px;

        border: 1px solid var(--overview-border);
        border-radius: 9px;

        background: #ffffff;
        color: #475467;

        font-size: 11px;
        line-height: 1.4;
        font-weight: 650;
      }

      .overview-error__icon {
        background: var(--overview-red-soft);
        color: var(--overview-red);
      }

      /* =========================================================
         ANIMATION
      ========================================================= */

      .spin {
        animation:
          spinOverview
          0.85s
          linear
          infinite;
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

      /* =========================================================
         TABLET
      ========================================================= */

      @media (max-width: 1050px) {
        .metria-overview {
          padding:
            32px 26px 44px;
        }

        .overview-hero {
          grid-template-columns: 1fr;
        }

        .overview-hero__side {
          max-width: 650px;
        }

        .ask-metria-panel {
          grid-template-columns: 1fr;
        }
      }

      /* =========================================================
         MOBILE
      ========================================================= */

      @media (max-width: 760px) {
        .metria-overview {
          padding:
            25px 16px 38px;
        }

        .overview-topbar {
          align-items: flex-start;
          flex-direction: column;

          margin-bottom: 24px;
        }

        .overview-topbar__actions {
          width: 100%;

          justify-content: space-between;
        }

        .overview-freshness {
          flex: 1;
        }

        .overview-hero {
          min-height: 0;

          padding:
            30px 22px;

          border-radius: 21px;
        }

        .overview-hero h2 {
          font-size: 34px;
          line-height: 1.08;
        }

        .overview-hero__brief {
          font-size: 16px;
          line-height: 1.7;
        }

        .health-panel > p,
        .focus-card > p,
        .intelligence-card > p,
        .personalized-card p,
        .ask-metria-panel p {
          font-size: 14px;
        }

        .overview-focus-grid,
        .overview-intelligence-grid,
        .watchlist-grid {
          grid-template-columns: 1fr;
        }

        .personalized-card {
          grid-template-columns:
            auto 1fr;
        }

        .personalized-card__badge {
          grid-column: 1 / -1;

          width: fit-content;
        }

        .overview-section {
          margin-top: 48px;
        }

        .overview-section-heading {
          align-items: flex-start;
        }

        .overview-section-heading p {
          font-size: 13px;
        }

        .ask-metria-panel {
          padding:
            28px 22px;
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
          min-height: 0;

          padding: 23px 20px;
        }

        .focus-card__header {
          align-items: flex-start;
        }

        .focus-card h3 {
          margin-top: 25px;
        }

        .personalized-card {
          grid-template-columns: 1fr;

          padding: 22px 20px;
        }

        .ask-metria-panel__intro {
          flex-direction: column;
        }

        .suggested-questions button {
          min-height: 58px;
        }
      }

      @media (
        prefers-reduced-motion:
        reduce
      ) {
        *,
        *::before,
        *::after {
          scroll-behavior:
            auto !important;

          animation-duration:
            0.01ms !important;

          animation-iteration-count:
            1 !important;

          transition-duration:
            0.01ms !important;
        }
      }
    `}</style>
  );
}