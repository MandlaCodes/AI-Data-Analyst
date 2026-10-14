/**
 * components/Visualizer.js - PRODUCTION EXECUTIVE VERSION
 * Flow: AI Insights -> Interactive Metria Analyst -> Dataset Identity -> Live Table -> Analytics
 */

import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { Line, Bar } from "react-chartjs-2";
import { buildVisualizationPlan, toChartJsData, formatMetric } from "./visualizationEngine";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

import {
  FiDownload,
  FiArrowUp,
  FiDatabase,
  FiPieChart,
  FiBarChart2,
  FiTrendingUp,
  FiTrendingDown,
  FiMaximize2,
  FiX,
  FiRefreshCw,
  FiTable,
  FiCpu,
  FiLayers,
  FiActivity
} from "react-icons/fi";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import AIAnalysisPanel from "./AIAnalysisPanel";
import { MetriaFollowUp } from "./MetriaFollowUp";

const API_BASE_URL =
  "https://ai-data-analyst-backend-1nuw.onrender.com";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const COLORS = [
  "#00F2FF",
  "#7000FF",
  "#FF007A",
  "#ADFF2F",
  "#FF8A00",
  "#00FF94"
];

const toNumber = (v) => {
  if (
    v === null ||
    v === undefined ||
    v === ""
  ) {
    return null;
  }

  if (typeof v === "number") {
    return v;
  }

  const s = String(v).trim();

  if (
    s.includes("/") ||
    (
      s.includes("-") &&
      s.split("-").length > 2
    )
  ) {
    return null;
  }

  const cleaned =
    s.replace(/[^\d.-]/g, "");

  if (
    cleaned === "" ||
    cleaned === "."
  ) {
    return null;
  }

  const n = Number(cleaned);

  return isNaN(n)
    ? null
    : n;
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: {
      display: false
    },

    tooltip: {
      backgroundColor: "#09090b",
      padding: 12,
      cornerRadius: 12,
      borderColor: "#27272a",
      borderWidth: 1,

      titleFont: {
        size: 11,
        weight: "bold"
      },

      bodyFont: {
        size: 10,
        family: "monospace"
      },

      displayColors: true,
      boxPadding: 6
    }
  },

  scales: {
    y: {
      grid: {
        color:
          "rgba(255,255,255,0.03)",

        drawBorder: false
      },

      ticks: {
        color: "#71717a",

        font: {
          size: 9,
          weight: "bold",
          family: "monospace"
        },

        padding: 8
      }
    },

    x: {
      grid: {
        display: false
      },

      ticks: {
        color: "#a1a1aa",

        font: {
          size: 9,
          weight: "600",
          family: "sans-serif"
        },

        autoSkip: false,
        maxRotation: 45,
        minRotation: 25,
        padding: 8
      }
    }
  }
};

export const Visualizer = ({
  activeDatasets = [],
  readyDatasets = [],
  chartType = "bar",
  chartTypeSet,
  authToken,
  onAIUpdate,

  // Shared analysis state from Analytics.jsx
  analysisMode = "individual",
  setAnalysisMode,
  activeDatasetIndex = 0,
  setActiveDatasetIndex,
  crossAnalysis = null,
  setCrossAnalysis,

  // Parent controls when the actual interactive analyst
  // is allowed to appear.
  interactiveAnalystReady = false
}) => {
  const [
    readyStates,
    setReadyStates
  ] = useState({});

  const [
    showScrollTop,
    setShowScrollTop
  ] = useState(false);

  const [
    flash,
    setFlash
  ] = useState(false);

  const [
    localChartTypes,
    setLocalChartTypes
  ] = useState({});

  const [
    expandedChart,
    setExpandedChart
  ] = useState(null);

  const [
    refreshKey,
    setRefreshKey
  ] = useState(0);

  // ------------------------------------------------------------
  // INDIVIDUAL ANALYSIS TARGET
  // ------------------------------------------------------------

  const [
    selectedDatasetId,
    setSelectedDatasetId
  ] = useState(
    activeDatasets[
      activeDatasetIndex
    ]?.id ||
      activeDatasets[0]?.id ||
      null
  );

  const effectiveAuthToken =
    authToken ||
    localStorage.getItem(
      "adt_token"
    );

  // ------------------------------------------------------------
  // SCROLL LISTENER
  // ------------------------------------------------------------

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(
        window.scrollY > 800
      );
    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  // ------------------------------------------------------------
  // RESTORE READY STATES FROM DATASET AI STORAGE
  // ------------------------------------------------------------

  useEffect(() => {
    const updatedReady = {};

    activeDatasets.forEach(
      (ds) => {
        if (ds.aiStorage) {
          updatedReady[
            ds.id
          ] = true;
        }
      }
    );

    setReadyStates(
      updatedReady
    );
  }, [activeDatasets]);

  // ------------------------------------------------------------
  // KEEP SELECTED DATASET SYNCED WITH PARENT
  // ------------------------------------------------------------

  useEffect(() => {
    if (
      activeDatasets.length ===
      0
    ) {
      setSelectedDatasetId(
        null
      );

      return;
    }

    const parentSelectedDataset =
      activeDatasets[
        activeDatasetIndex
      ] ||
      activeDatasets[0];

    if (
      parentSelectedDataset &&
      parentSelectedDataset.id !==
        selectedDatasetId
    ) {
      setSelectedDatasetId(
        parentSelectedDataset.id
      );
    }
  }, [
    activeDatasets,
    activeDatasetIndex,
    selectedDatasetId
  ]);

  // ------------------------------------------------------------
  // HANDLE INDIVIDUAL DATASET SELECTION
  // ------------------------------------------------------------

  const handleSelectedDatasetChange =
    (datasetId) => {
      setSelectedDatasetId(
        datasetId
      );

      const index =
        activeDatasets.findIndex(
          (dataset) =>
            dataset.id ===
            datasetId
        );

      if (
        index !== -1 &&
        typeof setActiveDatasetIndex ===
          "function"
      ) {
        setActiveDatasetIndex(
          index
        );
      }
    };

  // ------------------------------------------------------------
  // FALL BACK TO INDIVIDUAL MODE WHEN ONLY ONE SOURCE REMAINS
  // ------------------------------------------------------------

  useEffect(() => {
    if (
      activeDatasets.length < 2
    ) {
      if (
        typeof setAnalysisMode ===
        "function"
      ) {
        setAnalysisMode(
          "individual"
        );
      }

      /*
       * IMPORTANT:
       *
       * Do not clear crossAnalysis here.
       *
       * Temporarily setting one dataset to Standby should not
       * destroy a previously completed cross analysis.
       *
       * Analytics.jsx owns persistence of the cached result.
       */
    }
  }, [
    activeDatasets.length,
    setAnalysisMode
  ]);

  // ------------------------------------------------------------
  // AI UPDATE HANDLER
  // ------------------------------------------------------------

  const handleAIComplete = (
    id,
    aiData
  ) => {
    setReadyStates(
      (prev) => ({
        ...prev,
        [id]: true
      })
    );

    if (onAIUpdate) {
      onAIUpdate(
        id,
        aiData
      );
    }
  };

  const handleRefresh = () => {
    setRefreshKey(
      (prev) =>
        prev + 1
    );
  };

  const toggleLocalChartType = (
    datasetId,
    colName
  ) => {
    const key =
      `${datasetId}-${colName}`;

    setLocalChartTypes(
      (prev) => ({
        ...prev,

        [key]:
          prev[key] ===
          "bar"
            ? "line"
            : "bar"
      })
    );
  };

  // ------------------------------------------------------------
  // PDF EXPORT
  // ------------------------------------------------------------

  const handleExport = async (
    id,
    name
  ) => {
    setFlash(true);

    setTimeout(
      () => {
        setFlash(false);
      },
      150
    );

    const element =
      document.getElementById(
        `report-${id}`
      );

    if (!element) {
      return;
    }

    const canvas =
      await html2canvas(
        element,
        {
          scale: 2,
          backgroundColor:
            "#000000",
          logging: false,
          useCORS: true
        }
      );

    const pdf =
      new jsPDF(
        "p",
        "mm",
        "a4"
      );

    const imgWidth =
      210;

    const imgHeight =
      (
        canvas.height *
        imgWidth
      ) /
      canvas.width;

    pdf.addImage(
      canvas.toDataURL(
        "image/png"
      ),
      "PNG",
      0,
      0,
      imgWidth,
      imgHeight
    );

    pdf.save(
      `Strategic_Report_${name}.pdf`
    );
  };

  // ------------------------------------------------------------
  // PARSE DATASETS FOR VISUALIZATION ONLY
  // ------------------------------------------------------------

  // Preserve the original imported data for AI and cross-analysis.
  // Chart planning is separate and never mutates source records.
  const parsed = useMemo(() => activeDatasets.map(ds => {
    const matrix = Array.isArray(ds.data) ? ds.data : [];
    const isMatrix = Array.isArray(matrix[0]);
    const columns = isMatrix ? matrix[0].map(String) : Object.keys(matrix[0] || {});
    const rows = isMatrix
      ? matrix.slice(1).map(values => Object.fromEntries(columns.map((col, index) => [col, values?.[index] ?? null])))
      : matrix;
    let visualization;
    try {
      visualization = buildVisualizationPlan({ name: ds.name, data: ds.data }, {
        maxCharts: 6,
        maxKpis: 8,
        maxCategories: 12
      });
    } catch (error) {
      console.error("[Metria Visualization] Chart planning failed:", error);
      visualization = { kpis: [], charts: [], warnings: ["Unable to interpret this dataset automatically. Your original records remain available."] };
    }
    return { ...ds, columns, rows, visualization };
  }), [activeDatasets, refreshKey]);

  const selectedDataset =
    parsed.find(
      (ds) =>
        ds.id ===
        selectedDatasetId
    ) ||
    parsed[0];

  // ------------------------------------------------------------
  // CROSS DATASETS
  // ------------------------------------------------------------
  //
  // IMPORTANT:
  //
  // These are UI copies only.
  //
  // aiStorage is removed from cross copies so AIAnalysisPanel
  // cannot mistake an old individual dataset brief for the
  // completed cross-analysis result.
  //
  // Original activeDatasets remain untouched.
  // ------------------------------------------------------------

  const crossDatasets =
    useMemo(
      () =>
        parsed.map(
          (ds) => ({
            ...ds,

            aiStorage:
              null
          })
        ),
      [parsed]
    );

  // ------------------------------------------------------------
  // CROSS-DATASET AI REQUEST
  // ------------------------------------------------------------

  const handleRunCrossAnalysis =
    async (
      datasetsForCross =
        crossDatasets
    ) => {
      if (
        !effectiveAuthToken
      ) {
        console.warn(
          "Cross analysis aborted: Missing auth token."
        );

        return null;
      }

      if (
        !datasetsForCross ||
        datasetsForCross.length <
          2
      ) {
        console.warn(
          "Cross analysis requires at least two active datasets."
        );

        return null;
      }

      try {
        /*
         * CRITICAL:
         *
         * Use activeDatasets as the authoritative raw source.
         *
         * Do NOT use Visualizer's parsed rows for backend
         * validation because the validator expects the
         * original imported matrix including the header row.
         */

        const contexts =
          datasetsForCross.map(
            (
              crossDs
            ) => {
              const original =
                activeDatasets.find(
                  (
                    sourceDs
                  ) =>
                    sourceDs.id ===
                    crossDs.id
                );

              const rawData =
                original &&
                Array.isArray(
                  original.data
                )
                  ? original.data
                  : Array.isArray(
                      crossDs.data
                    )
                    ? crossDs.data
                    : [];

              return {
                id:
                  original?.id ??
                  crossDs.id,

                name:
                  original?.name ||
                  crossDs.name ||
                  "Dataset",

                data:
                  rawData,

                rows:
                  rawData
              };
            }
          );

        // ----------------------------------------------------------
        // SAFETY CHECK BEFORE REQUEST
        // ----------------------------------------------------------

        const unusableDataset =
          contexts.find(
            (ctx) =>
              !Array.isArray(
                ctx.data
              ) ||
              ctx.data.length <
                2 ||
              !Array.isArray(
                ctx.data[0]
              )
          );

        if (
          unusableDataset
        ) {
          console.error(
            "[Metria Cross Analysis] Invalid source:",
            unusableDataset
          );

          throw new Error(
            `${unusableDataset.name} does not contain a valid table structure.`
          );
        }

        // ----------------------------------------------------------
        // DEVELOPMENT DIAGNOSTIC
        // ----------------------------------------------------------

        console.log(
          "[Metria Cross Analysis Payload]",

          contexts.map(
            (ctx) => ({
              id:
                ctx.id,

              name:
                ctx.name,

              rowCount:
                ctx.data
                  .length,

              header:
                ctx.data[
                  0
                ],

              firstRecord:
                ctx.data[
                  1
                ]
            })
          )
        );

        const response =
          await axios.post(
            `${API_BASE_URL}/ai/analyze`,

            {
              contexts
            },

            {
              headers: {
                Authorization:
                  `Bearer ${effectiveAuthToken}`,

                "Content-Type":
                  "application/json"
              }
            }
          );

        if (
          response.data
        ) {
          console.log(
            "[Metria Cross Analysis Result]",
            response.data
          );

          /*
           * CRITICAL:
           *
           * Keep using the genuine React setter supplied by
           * Analytics.jsx.
           *
           * Analytics handles persistence separately.
           */

          if (
            typeof setCrossAnalysis ===
            "function"
          ) {
            setCrossAnalysis(
              response.data
            );
          }

          return response.data;
        }

        return null;
      } catch (
        error
      ) {
        console.error(
          "Cross analysis failed:",
          error.response
            ?.data ||
            error.message
        );

        throw error;
      }
    };

  // ------------------------------------------------------------
  // NOTHING ACTIVE
  // ------------------------------------------------------------

  if (
    activeDatasets.length ===
    0
  ) {
    return null;
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      key={
        refreshKey
      }
      className="mt-10 md:mt-16 space-y-16 pb-32 max-w-[1600px] mx-auto px-4 md:px-10"
    >

      {flash && (
        <div className="fixed inset-0 z-[9999] bg-white pointer-events-none" />
      )}

      {/* ======================================================== */}
      {/* 1. TOP AI ANALYSIS RUN                                  */}
      {/* ======================================================== */}

      <section className="scroll-mt-28">

        {/* ====================================================== */}
        {/* ANALYSIS MODE SELECTOR                                 */}
        {/* ====================================================== */}

        {parsed.length >
          1 && (
          <div className="mb-10 p-6 md:p-8 rounded-[2rem] bg-white/[0.02] border border-white/10">

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">

              <div>

                <div className="flex items-center gap-3 mb-2">

                  <FiActivity className="text-indigo-400" />

                  <p className="text-[10px] font-black uppercase tracking-[0.45em] text-white/50">
                    Analysis Mode
                  </p>

                </div>

                <p className="text-sm text-white/50 max-w-2xl">
                  Analyze one source independently or connect all active
                  datasets to uncover relationships between them.
                </p>

              </div>

              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                {parsed.length} Sources Active
              </span>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* INDIVIDUAL MODE */}

              <button
                onClick={() => {
                  if (
                    typeof setAnalysisMode ===
                    "function"
                  ) {
                    setAnalysisMode(
                      "individual"
                    );
                  }
                }}
                className={`text-left p-5 md:p-6 rounded-2xl border transition-all ${
                  analysisMode ===
                  "individual"
                    ? "bg-indigo-500/10 border-indigo-400/60 shadow-[0_0_30px_rgba(99,102,241,0.08)]"
                    : "bg-black/20 border-white/10 hover:border-white/20"
                }`}
              >

                <div className="flex items-start gap-4">

                  <div
                    className={`p-3 rounded-xl border ${
                      analysisMode ===
                      "individual"
                        ? "bg-indigo-500/10 border-indigo-400/30 text-indigo-300"
                        : "bg-white/5 border-white/10 text-zinc-600"
                    }`}
                  >

                    <FiDatabase
                      size={
                        20
                      }
                    />

                  </div>

                  <div>

                    <p
                      className={`text-[11px] font-black uppercase tracking-[0.25em] ${
                        analysisMode ===
                        "individual"
                          ? "text-white"
                          : "text-white/50"
                      }`}
                    >
                      Individual Analysis
                    </p>

                    <p className="text-[10px] text-white/40 mt-2 leading-relaxed">
                      Analyze each dataset independently with its own
                      executive brief, risks and actions.
                    </p>

                  </div>

                </div>

              </button>

              {/* CROSS MODE */}

              <button
                onClick={() => {
                  if (
                    typeof setAnalysisMode ===
                    "function"
                  ) {
                    setAnalysisMode(
                      "cross"
                    );
                  }
                }}
                className={`text-left p-5 md:p-6 rounded-2xl border transition-all ${
                  analysisMode ===
                  "cross"
                    ? "bg-purple-500/10 border-purple-400/60 shadow-[0_0_30px_rgba(188,19,254,0.08)]"
                    : "bg-black/20 border-white/10 hover:border-white/20"
                }`}
              >

                <div className="flex items-start gap-4">

                  <div
                    className={`p-3 rounded-xl border ${
                      analysisMode ===
                      "cross"
                        ? "bg-purple-500/10 border-purple-400/30 text-purple-300"
                        : "bg-white/5 border-white/10 text-zinc-600"
                    }`}
                  >

                    <FiLayers
                      size={
                        20
                      }
                    />

                  </div>

                  <div>

                    <p
                      className={`text-[11px] font-black uppercase tracking-[0.25em] ${
                        analysisMode ===
                        "cross"
                          ? "text-white"
                          : "text-white/50"
                      }`}
                    >
                      Cross Analysis
                    </p>

                    <p className="text-[10px] text-white/40 mt-2 leading-relaxed">
                      Connect all active sources to identify shared
                      drivers, relationships, risks and opportunities.
                    </p>

                  </div>

                </div>

              </button>

            </div>

          </div>
        )}

        {/* ====================================================== */}
        {/* INDIVIDUAL ANALYSIS TARGET                             */}
        {/* ====================================================== */}

        {analysisMode ===
          "individual" &&
          parsed.length >
            1 && (
          <div className="mb-10">

            <div className="flex items-center justify-between gap-4 mb-4">

              <div>

                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">
                  Analysis_Target
                </p>

                <p className="text-xs text-white/50 mt-1">
                  Select the dataset for individual neural analysis
                </p>

              </div>

              <span className="text-[9px] font-mono text-zinc-600 uppercase">
                Individual Mode
              </span>

            </div>

            <div className="flex gap-3 overflow-x-auto pb-2">

              {parsed.map(
                (
                  ds
                ) => (
                  <button
                    key={
                      ds.id
                    }

                    onClick={() =>
                      handleSelectedDatasetChange(
                        ds.id
                      )
                    }

                    className={`shrink-0 px-5 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      selectedDatasetId ===
                      ds.id
                        ? "bg-indigo-500 text-white border-indigo-400"
                        : "bg-white/[0.03] text-white/40 border-white/10 hover:text-white hover:border-white/20"
                    }`}
                  >

                    <FiDatabase className="inline mr-2" />

                    {
                      ds.name
                    }

                  </button>
                )
              )}

            </div>

          </div>
        )}

        {/* ====================================================== */}
        {/* CROSS ANALYSIS SOURCES                                 */}
        {/* ====================================================== */}

        {analysisMode ===
          "cross" &&
          parsed.length >
            1 && (
          <div className="mb-10">

            <div className="flex items-center justify-between gap-4 mb-4">

              <div>

                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-purple-300/60">
                  Cross_Analysis_Sources
                </p>

                <p className="text-xs text-white/50 mt-1">
                  Metria will analyze relationships across all active sources
                </p>

              </div>

              <span className="text-[9px] font-mono text-purple-400/60 uppercase">
                {parsed.length} Sources Linked
              </span>

            </div>

            <div className="flex flex-wrap items-center gap-3">

              {parsed.map(
                (
                  ds,
                  index
                ) => (
                  <React.Fragment
                    key={
                      ds.id
                    }
                  >

                    <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20">

                      <FiDatabase className="text-purple-300" />

                      <span className="text-[10px] font-black uppercase tracking-widest text-white">
                        {
                          ds.name
                        }
                      </span>

                    </div>

                    {index <
                      parsed.length -
                        1 && (
                      <span className="text-purple-400 font-black">
                        +
                      </span>
                    )}

                  </React.Fragment>
                )
              )}

            </div>

          </div>
        )}

        {/* ====================================================== */}
        {/* ACTIVE ANALYSIS DIVIDER                                */}
        {/* ====================================================== */}

        <div className="mb-6 flex items-center gap-4">

          <div className="h-[1px] flex-1 bg-white/10" />

          <div className="flex items-center gap-2">

            <FiCpu
              className={`animate-pulse ${
                analysisMode ===
                "cross"
                  ? "text-purple-400"
                  : "text-[#a5b4fc]"
              }`}
            />

            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">

              {analysisMode ===
              "cross"
                ? `Cross Analysis: ${parsed.length} Linked Sources`
                : `Live Analysis: ${
                    selectedDataset
                      ?.name ||
                    "Active Session"
                  }`
              }

            </span>

          </div>

          <div className="h-[1px] flex-1 bg-white/10" />

        </div>

        {/* ====================================================== */}
        {/* STRATEGIC BRIEF                                       */}
        {/* ====================================================== */}

        <AIAnalysisPanel
          datasets={
            analysisMode ===
            "cross"
              ? crossDatasets
              : selectedDataset
                ? [
                    selectedDataset
                  ]
                : []
          }

          analysisMode={
            analysisMode
          }

          activeDatasetIndex={
            activeDatasetIndex
          }

          crossAnalysis={
            crossAnalysis
          }

          onRunCrossAnalysis={
            handleRunCrossAnalysis
          }

          onUpdateAI={
            handleAIComplete
          }
        />

        {/* ====================================================== */}
        {/* INTERACTIVE METRIA ANALYST                              */}
        {/* Strategic Brief -> Ask Metria -> Evidence              */}
        {/* ====================================================== */}

        {interactiveAnalystReady && (
          <div
            id="metria-analyst"
            data-metria-analyst="true"
            className="mt-8 md:mt-10 scroll-mt-24"
          >

            <MetriaFollowUp
              activeDatasets={
                activeDatasets
              }

              activeDataset={
                analysisMode ===
                "cross"
                  ? null
                  : selectedDataset ||
                    activeDatasets[
                      activeDatasetIndex
                    ] ||
                    activeDatasets[
                      activeDatasets.length -
                        1
                    ] ||
                    null
              }

              analysisMode={
                analysisMode
              }

              crossAnalysis={
                crossAnalysis
              }

              authToken={
                effectiveAuthToken
              }

              aiAnalysisReady={
                interactiveAnalystReady
              }
            />

          </div>
        )}

      </section>

      {/* ======================================================== */}
      {/* DATASET VISUALIZATIONS                                  */}
      {/* ======================================================== */}

      {parsed.map(
        (ds) => {
          const { kpis = [], charts = [], warnings = [] } = ds.visualization || {};

          /*
           * CROSS MODE:
           *
           * Do not reveal any dataset evidence until the
           * cross-analysis request has actually completed.
           */

          if (
            analysisMode ===
              "cross" &&
            !crossAnalysis
          ) {
            return null;
          }

          /*
           * INDIVIDUAL MODE:
           *
           * Do not reveal a dataset until that individual
           * strategic brief exists.
           */

          if (
            analysisMode !==
              "cross" &&
            !readyStates[
              ds.id
            ]
          ) {
            return null;
          }

          return (
            <div
              key={
                ds.id
              }
              className="space-y-12 md:space-y-20 animate-in fade-in slide-in-from-bottom-10 duration-1000"
              id={
                `report-${ds.id}`
              }
            >

              {/* ================================================= */}
              {/* DATASET IDENTITY HEADER                           */}
              {/* ================================================= */}

              <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-10 gap-8">

                <div className="max-w-full">

                  <div className="flex items-center gap-3 mb-4">

                    <div className="p-2.5 bg-[#7000FF]/10 rounded-xl border border-[#7000FF]/20">

                      <FiDatabase className="text-[#7000FF] w-5 h-5" />

                    </div>

                    <h3 className="text-zinc-500 font-black text-[9px] uppercase tracking-[0.6em]">
                      System_Source_Verified
                    </h3>

                  </div>

                  <h2 className="text-5xl sm:text-6xl md:text-8xl font-[1000] text-white uppercase tracking-tighter italic leading-none break-words">
                    {
                      ds.name
                    }
                  </h2>

                </div>

                <div className="flex w-full md:w-auto gap-4">

                  <button
                    onClick={
                      handleRefresh
                    }
                    className="flex-1 md:flex-none p-5 bg-zinc-900/50 border border-white/10 text-white rounded-2xl hover:bg-zinc-800 transition-all"
                  >

                    <FiRefreshCw className="w-5 h-5" />

                  </button>

                  <button
                    onClick={() =>
                      handleExport(
                        ds.id,
                        ds.name
                      )
                    }
                    className="flex-[3] md:flex-none flex items-center justify-center gap-4 px-8 py-5 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all shadow-xl"
                  >

                    <FiDownload className="w-5 h-5" />

                    Download Report

                  </button>

                </div>

              </div>

              {/* ================================================= */}
              {/* LIVE TABLE                                        */}
              {/* ================================================= */}

              <div className="bg-[#0a0a0f] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">

                <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">

                  <div className="flex items-center gap-3">

                    <FiTable className="text-zinc-500 w-4 h-4" />

                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest italic">
                      Full_Dataset_Records
                    </span>

                  </div>

                  <span className="text-[9px] font-bold text-zinc-600 font-mono uppercase tracking-widest">
                    {ds.rows.length} Total Records Found
                  </span>

                </div>

                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">

                  <table className="w-full text-left border-collapse min-w-[800px]">

                    <thead className="sticky top-0 bg-[#0a0a0f] z-10">

                      <tr className="bg-black/60 backdrop-blur-md">

                        {ds.columns.map(
                          (
                            col
                          ) => (
                            <th
                              key={
                                col
                              }
                              className="px-8 py-5 text-[10px] font-black text-white/70 uppercase tracking-wider border-b border-white/5"
                            >
                              {
                                col
                              }
                            </th>
                          )
                        )}

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-white/[0.03]">

                      {ds.rows.map(
                        (
                          row,
                          i
                        ) => (
                          <tr
                            key={
                              i
                            }
                            className="hover:bg-white/[0.02] transition-colors group"
                          >

                            {ds.columns.map(
                              (
                                col
                              ) => (
                                <td
                                  key={
                                    col
                                  }
                                  className="px-8 py-4 text-[11px] font-medium text-zinc-400 font-mono truncate max-w-[200px] group-hover:text-white transition-colors"
                                >
                                  {
                                    row[
                                      col
                                    ]
                                  }
                                </td>
                              )
                            )}

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>

                <div className="px-8 py-4 bg-black/40 border-t border-white/5">

                  <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest text-center italic">
                    End of Dataset Records
                  </p>

                </div>

              </div>

              {/* ================================================= */}
              {/* ANALYTICS CARDS & GRAPHS                          */}
              {/* ================================================= */}

              <div className="space-y-16">

                {/* KPI cards are derived from validated aggregates, not row averages. */}
                {kpis.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {kpis.map((kpi, idx) => (
                      <div key={kpi.key} className="relative overflow-hidden bg-[#0d0d12] border border-white/10 rounded-[2.5rem] p-8 text-white shadow-2xl hover:border-[#7000FF]/30 transition-all">
                        <div className="absolute top-0 left-0 w-full h-[3px]" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-5">{kpi.label}</p>
                        <p className="text-3xl md:text-4xl font-black tracking-tight break-words">
                          {formatMetric(kpi.value, kpi.unit)}
                        </p>
                        <p className="text-[10px] text-zinc-600 mt-5 uppercase tracking-wider">
                          {kpi.aggregation === "ratio" ? "Calculated ratio" : kpi.aggregation === "sum" ? "Total across records" : kpi.aggregation === "average" || kpi.aggregation === "avg" ? "Average" : kpi.aggregation || "Metric"}
                        </p>
                        {kpi.formula && <p className="text-[10px] text-zinc-500 mt-2 break-words">{kpi.formula}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {warnings.length > 0 && (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] px-6 py-4 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">Data interpretation notes</p>
                    {warnings.map((warning, index) => <p key={index} className="text-xs text-zinc-400">{warning}</p>)}
                  </div>
                )}

                {charts.length ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                    {charts.map((chart, idx) => {
                      const key = `${ds.id}-${chart.id}`;
                      const activeType = localChartTypes[key] || chart.type;
                      const color = COLORS[idx % COLORS.length];
                      const chartData = toChartJsData({ ...chart, type: activeType }, [color]);
                      const options = {
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          tooltip: {
                            ...chartOptions.plugins.tooltip,
                            callbacks: {
                              label: context => `${context.dataset.label}: ${formatMetric(context.parsed.y, chart.unit)}`
                            }
                          }
                        },
                        scales: {
                          ...chartOptions.scales,
                          x: {
                            ...chartOptions.scales.x,
                            ticks: { ...chartOptions.scales.x.ticks, autoSkip: true, maxTicksLimit: 12, maxRotation: 35, minRotation: 0 }
                          },
                          y: {
                            ...chartOptions.scales.y,
                            beginAtZero: chart.values.every(value => value >= 0),
                            ticks: {
                              ...chartOptions.scales.y.ticks,
                              callback: value => formatMetric(Number(value), chart.unit)
                            }
                          }
                        }
                      };
                      return (
                        <div key={key} className="group relative border border-white/10 rounded-[3rem] p-8 md:p-12 bg-[#0a0a0f] shadow-2xl transition-all flex flex-col hover:border-white/20">
                          <div className="flex justify-between items-start mb-8 gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}77` }} />
                                <h4 className="text-white text-[11px] font-black uppercase tracking-[0.25em] break-words">{chart.title}</h4>
                              </div>
                              <p className="text-zinc-500 text-[11px] leading-relaxed">{chart.subtitle}</p>
                              {chart.note && <p className="text-amber-300/70 text-[10px] mt-2">{chart.note}</p>}
                            </div>
                            <div className="flex gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/5 shrink-0">
                              <button type="button" aria-label={`Expand ${chart.title}`} onClick={() => setExpandedChart({ title: chart.title, data: chartData, type: activeType, options })} className="p-2 text-zinc-500 hover:text-white transition-colors">
                                <FiMaximize2 className="w-5 h-5" />
                              </button>
                              <button type="button" aria-label={`Switch chart type for ${chart.title}`} onClick={() => setLocalChartTypes(prev => ({ ...prev, [key]: activeType === "line" ? "bar" : "line" }))} className="p-2 text-zinc-500 hover:text-white transition-colors">
                                {activeType === "line" ? <FiBarChart2 className="w-5 h-5" /> : <FiTrendingUp className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>
                          <div className="w-full aspect-[4/3] sm:aspect-[16/9] relative">
                            {activeType === "line" ? <Line data={chartData} options={options} /> : <Bar data={chartData} options={options} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 border border-white/10 rounded-[2rem] bg-[#0a0a0f] text-zinc-400 text-sm">
                    No reliable automatic charts were inferred from this dataset. Your records remain available above.
                  </div>
                )}

              </div>

            </div>
          );
        }
      )}

      {/* ======================================================== */}
      {/* EXPANDED CHART                                          */}
      {/* ======================================================== */}

      {expandedChart && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6 md:p-12">

          <button
            onClick={() =>
              setExpandedChart(
                null
              )
            }
            className="absolute top-10 right-10 p-4 bg-white/5 border border-white/10 text-white rounded-full hover:bg-white/10"
          >

            <FiX className="w-8 h-8" />

          </button>

          <div className="w-full h-full max-w-7xl flex flex-col">

            <h2 className="text-white text-4xl md:text-6xl font-[1000] uppercase italic tracking-tighter mb-10">
              {
                expandedChart.title
              }
            </h2>

            <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-[4rem] p-10">

              {expandedChart.type ===
              "bar" ? (
                <Bar
                  data={
                    expandedChart.data
                  }
                  options={
                    expandedChart.options || chartOptions
                  }
                />
              ) : (
                <Line
                  data={
                    expandedChart.data
                  }
                  options={
                    expandedChart.options || chartOptions
                  }
                />
              )}

            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* SCROLL TO TOP                                           */}
      {/* ======================================================== */}

      {showScrollTop && (
        <button
          onClick={() =>
            window.scrollTo(
              {
                top:
                  0,

                behavior:
                  "smooth"
              }
            )
          }
          className="fixed bottom-10 right-10 z-[100] w-16 h-16 bg-white text-black rounded-full flex items-center justify-center border-8 border-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-90 transition-all"
        >

          <FiArrowUp className="w-6 h-6" />

        </button>
      )}

    </div>
  );
};