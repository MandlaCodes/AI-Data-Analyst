/**
 * components/Visualizer.js - PRODUCTION EXECUTIVE VERSION
 * Flow: AI Insights -> Dataset Identity -> Live Table -> Analytics
 */
import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { Line, Bar, Pie } from "react-chartjs-2";
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
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;

  const s = String(v).trim();

  if (
    s.includes("/") ||
    (s.includes("-") && s.split("-").length > 2)
  ) {
    return null;
  }

  const cleaned = s.replace(/[^\d.-]/g, "");

  if (cleaned === "" || cleaned === ".") return null;

  const n = Number(cleaned);

  return isNaN(n) ? null : n;
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
        color: "rgba(255,255,255,0.03)",
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
  setCrossAnalysis
}) => {
  const [readyStates, setReadyStates] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [flash, setFlash] = useState(false);
  const [localChartTypes, setLocalChartTypes] = useState({});
  const [expandedChart, setExpandedChart] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // ------------------------------------------------------------
  // INDIVIDUAL ANALYSIS TARGET
  // ------------------------------------------------------------
  const [selectedDatasetId, setSelectedDatasetId] = useState(
    activeDatasets[activeDatasetIndex]?.id ||
      activeDatasets[0]?.id ||
      null
  );

  const effectiveAuthToken =
    authToken || localStorage.getItem("adt_token");

  // ------------------------------------------------------------
  // SCROLL LISTENER
  // ------------------------------------------------------------
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 800);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // ------------------------------------------------------------
  // RESTORE READY STATES FROM DATASET AI STORAGE
  // ------------------------------------------------------------
  useEffect(() => {
    const updatedReady = {};

    activeDatasets.forEach((ds) => {
      if (ds.aiStorage) {
        updatedReady[ds.id] = true;
      }
    });

    setReadyStates(updatedReady);
  }, [activeDatasets]);

  // ------------------------------------------------------------
  // KEEP SELECTED DATASET SYNCED WITH PARENT
  // ------------------------------------------------------------
  useEffect(() => {
    if (activeDatasets.length === 0) {
      setSelectedDatasetId(null);
      return;
    }

    const parentSelectedDataset =
      activeDatasets[activeDatasetIndex] ||
      activeDatasets[0];

    if (
      parentSelectedDataset &&
      parentSelectedDataset.id !== selectedDatasetId
    ) {
      setSelectedDatasetId(parentSelectedDataset.id);
    }
  }, [
    activeDatasets,
    activeDatasetIndex,
    selectedDatasetId
  ]);

  // ------------------------------------------------------------
  // HANDLE INDIVIDUAL DATASET SELECTION
  // ------------------------------------------------------------
  const handleSelectedDatasetChange = (datasetId) => {
    setSelectedDatasetId(datasetId);

    const index = activeDatasets.findIndex(
      (dataset) => dataset.id === datasetId
    );

    if (
      index !== -1 &&
      typeof setActiveDatasetIndex === "function"
    ) {
      setActiveDatasetIndex(index);
    }
  };

  // ------------------------------------------------------------
  // FALL BACK TO INDIVIDUAL MODE WHEN ONLY ONE SOURCE REMAINS
  // ------------------------------------------------------------
  useEffect(() => {
    if (activeDatasets.length < 2) {
      if (typeof setAnalysisMode === "function") {
        setAnalysisMode("individual");
      }

      if (typeof setCrossAnalysis === "function") {
        setCrossAnalysis(null);
      }
    }
  }, [
    activeDatasets.length,
    setAnalysisMode,
    setCrossAnalysis
  ]);

  // ------------------------------------------------------------
  // INVALIDATE OLD CROSS ANALYSIS IF SOURCE COMBINATION CHANGES
  // ------------------------------------------------------------
  const activeDatasetSignature = useMemo(
    () =>
      activeDatasets
        .map((ds) => String(ds.id))
        .join("|"),
    [activeDatasets]
  );

  useEffect(() => {
    if (typeof setCrossAnalysis === "function") {
      setCrossAnalysis(null);
    }
  }, [
    activeDatasetSignature,
    setCrossAnalysis
  ]);

  // ------------------------------------------------------------
  // AI UPDATE HANDLER
  // ------------------------------------------------------------
  const handleAIComplete = (id, aiData) => {
    setReadyStates((prev) => ({
      ...prev,
      [id]: true
    }));

    if (onAIUpdate) {
      onAIUpdate(id, aiData);
    }
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const toggleLocalChartType = (
    datasetId,
    colName
  ) => {
    const key = `${datasetId}-${colName}`;

    setLocalChartTypes((prev) => ({
      ...prev,
      [key]:
        prev[key] === "bar"
          ? "line"
          : "bar"
    }));
  };

  // ------------------------------------------------------------
  // PDF EXPORT
  // ------------------------------------------------------------
  const handleExport = async (id, name) => {
    setFlash(true);

    setTimeout(() => {
      setFlash(false);
    }, 150);

    const element =
      document.getElementById(
        `report-${id}`
      );

    if (!element) return;

    const canvas = await html2canvas(
      element,
      {
        scale: 2,
        backgroundColor: "#000000",
        logging: false,
        useCORS: true
      }
    );

    const pdf = new jsPDF(
      "p",
      "mm",
      "a4"
    );

    const imgWidth = 210;

    const imgHeight =
      (canvas.height * imgWidth) /
      canvas.width;

    pdf.addImage(
      canvas.toDataURL("image/png"),
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
  const parsed = useMemo(() => {
    return activeDatasets.map((ds) => {
      const columns = Array.isArray(
        ds.data?.[0]
      )
        ? ds.data[0]
        : Object.keys(
            ds.data?.[0] || {}
          );

      const rows = Array.isArray(
        ds.data?.[0]
      )
        ? ds.data
            .slice(1)
            .map((r) =>
              Object.fromEntries(
                columns.map(
                  (c, i) => [
                    c,
                    r[i]
                  ]
                )
              )
            )
        : ds.data || [];

      // --------------------------------------------------------
      // SMART LABEL SELECTION
      // --------------------------------------------------------
      const labelCol =
        columns.find((col) => {
          const cLower =
            String(col).toLowerCase();

          if (
            cLower.includes("value") ||
            cLower.includes("amount") ||
            cLower.includes("price") ||
            cLower.includes("cost") ||
            cLower.includes("total") ||
            cLower.includes("revenue")
          ) {
            return false;
          }

          return (
            cLower.includes("name") ||
            cLower.includes("product") ||
            cLower.includes("item") ||
            cLower.includes("deal") ||
            cLower.includes("client") ||
            cLower.includes("company") ||
            cLower.includes("rep") ||
            cLower.includes("title") ||
            cLower.includes("id")
          );
        }) ||
        columns.find((col) => {
          const cLower =
            String(col).toLowerCase();

          return (
            cLower.includes("date") ||
            cLower.includes("time")
          );
        }) ||
        columns[0];

      const labelColName =
        labelCol
          ? String(labelCol)
          : "";

      const isDateLabel =
        labelColName
          .toLowerCase()
          .includes("date") ||
        labelColName
          .toLowerCase()
          .includes("time");

      // --------------------------------------------------------
      // COLUMN ANALYSIS
      // --------------------------------------------------------
      const analysis =
        columns.map((col) => {
          const chartValues =
            rows.map((r) =>
              toNumber(r[col])
            );

          const numeric =
            chartValues.filter(
              (v) => v !== null
            );

          const colName =
            String(col).toLowerCase();

          const isDateCol =
            colName.includes(
              "date"
            ) ||
            colName.includes(
              "time"
            );

          const isNumeric =
            numeric.length > 0 &&
            col !== labelCol &&
            !isDateCol;

          let stats = null;

          if (isNumeric) {
            const mid =
              Math.floor(
                numeric.length / 2
              );

            const firstHalf =
              numeric.slice(
                0,
                mid
              );

            const secondHalf =
              numeric.slice(mid);

            const avg1 =
              firstHalf.reduce(
                (a, b) => a + b,
                0
              ) /
              (firstHalf.length ||
                1);

            const avg2 =
              secondHalf.reduce(
                (a, b) => a + b,
                0
              ) /
              (secondHalf.length ||
                1);

            const trendVal =
              avg1 === 0
                ? 0
                : ((avg2 - avg1) /
                    avg1) *
                  100;

            stats = {
              avg:
                numeric.reduce(
                  (a, b) => a + b,
                  0
                ) /
                numeric.length,

              min:
                Math.min(
                  ...numeric
                ),

              max:
                Math.max(
                  ...numeric
                ),

              sum:
                numeric.reduce(
                  (a, b) => a + b,
                  0
                ),

              trend:
                Math.abs(
                  trendVal
                ).toFixed(1),

              trendDir:
                trendVal >= 0
                  ? "up"
                  : "down"
            };
          }

          const freq = {};

          if (!isNumeric) {
            rows.forEach((r) => {
              const val =
                r[col] || "N/A";

              freq[val] =
                (freq[val] ||
                  0) + 1;
            });
          }

          return {
            col,
            isNumeric,
            numeric,
            chartValues,
            stats,
            freq
          };
        });

      return {
        ...ds,
        rows,
        columns,
        analysis,
        labelCol,
        isDateLabel,

        labels: rows.map((r) =>
          labelCol
            ? r[labelCol] ||
              "N/A"
            : "N/A"
        )
      };
    });
  }, [
    activeDatasets,
    refreshKey
  ]);

  const selectedDataset =
    parsed.find(
      (ds) =>
        ds.id ===
        selectedDatasetId
    ) || parsed[0];

  // ------------------------------------------------------------
  // CROSS DATASETS
  //
  // IMPORTANT:
  // These are only UI copies.
  // Original data is still available through activeDatasets.
  // ------------------------------------------------------------
  const crossDatasets = useMemo(
    () =>
      parsed.map((ds) => ({
        ...ds,
        aiStorage: null
      })),
    [parsed]
  );

  // ------------------------------------------------------------
  // CROSS-DATASET AI REQUEST
  // ------------------------------------------------------------
  const handleRunCrossAnalysis = async (
    datasetsForCross = crossDatasets
  ) => {
    if (!effectiveAuthToken) {
      console.warn(
        "Cross analysis aborted: Missing auth token."
      );

      return null;
    }

    if (
      !datasetsForCross ||
      datasetsForCross.length < 2
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
       * Do NOT use Visualizer's parsed rows for backend validation.
       */
      const contexts =
        datasetsForCross.map(
          (crossDs) => {
            const original =
              activeDatasets.find(
                (sourceDs) =>
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

              data: rawData,
              rows: rawData
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
            ctx.data.length < 2 ||
            !Array.isArray(
              ctx.data[0]
            )
        );

      if (unusableDataset) {
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
            id: ctx.id,
            name: ctx.name,
            rowCount:
              ctx.data.length,
            header:
              ctx.data[0],
            firstRecord:
              ctx.data[1]
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

      if (response.data) {
        console.log(
          "[Metria Cross Analysis Result]",
          response.data
        );

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
    } catch (error) {
      console.error(
        "Cross analysis failed:",
        error.response?.data ||
          error.message
      );

      throw error;
    }
  };

  if (
    activeDatasets.length === 0
  ) {
    return null;
  }

  return (
    <div
      key={refreshKey}
      className="mt-10 md:mt-16 space-y-16 pb-32 max-w-[1600px] mx-auto px-4 md:px-10"
    >
      {flash && (
        <div className="fixed inset-0 z-[9999] bg-white pointer-events-none" />
      )}

      {/* ======================================================== */}
      {/* 1. TOP AI ANALYSIS RUN                                  */}
      {/* ======================================================== */}
      <section className="scroll-mt-28">

        {/* ANALYSIS MODE SELECTOR */}
        {parsed.length > 1 && (
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

                  if (
                    typeof setCrossAnalysis ===
                    "function"
                  ) {
                    setCrossAnalysis(null);
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
                      size={20}
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

                  if (
                    typeof setCrossAnalysis ===
                    "function"
                  ) {
                    setCrossAnalysis(null);
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
                      size={20}
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
          parsed.length > 1 && (
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
                  (ds) => (
                    <button
                      key={ds.id}
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

                      {ds.name}
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
          parsed.length > 1 && (
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
                  (ds, index) => (
                    <React.Fragment
                      key={ds.id}
                    >
                      <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20">

                        <FiDatabase className="text-purple-300" />

                        <span className="text-[10px] font-black uppercase tracking-widest text-white">
                          {ds.name}
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

        {/* ACTIVE ANALYSIS DIVIDER */}
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
                    selectedDataset?.name ||
                    "Active Session"
                  }`}
            </span>
          </div>

          <div className="h-[1px] flex-1 bg-white/10" />
        </div>

        {/* ====================================================== */}
        {/* AI PANEL                                               */}
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
      </section>

      {/* ======================================================== */}
      {/* DATASET VISUALIZATIONS                                  */}
      {/* ======================================================== */}
      {parsed.map((ds) => {
        const numericCols =
          ds.analysis.filter(
            (c) => c.isNumeric
          );

        const categoricalCols =
          ds.analysis.filter(
            (c) =>
              !c.isNumeric &&
              Object.keys(c.freq)
                .length > 1 &&
              Object.keys(c.freq)
                .length < 15
          );

        if (
          analysisMode !==
            "cross" &&
          !readyStates[ds.id]
        ) {
          return null;
        }

        return (
          <div
            key={ds.id}
            className="space-y-12 md:space-y-20 animate-in fade-in slide-in-from-bottom-10 duration-1000"
            id={`report-${ds.id}`}
          >

            {/* 2. DATASET IDENTITY HEADER */}
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
                  {ds.name}
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

            {/* 3. LIVE TABLE */}
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
                        (col) => (
                          <th
                            key={col}
                            className="px-8 py-5 text-[10px] font-black text-white/70 uppercase tracking-wider border-b border-white/5"
                          >
                            {col}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.03]">

                    {ds.rows.map(
                      (row, i) => (
                        <tr
                          key={i}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          {ds.columns.map(
                            (col) => (
                              <td
                                key={col}
                                className="px-8 py-4 text-[11px] font-medium text-zinc-400 font-mono truncate max-w-[200px] group-hover:text-white transition-colors"
                              >
                                {row[col]}
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

            {/* 4. ANALYTICS CARDS & GRAPHS */}
            <div className="space-y-16">

              {/* STAT CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                {numericCols
                  .slice(0, 4)
                  .map(
                    (col, idx) => (
                      <div
                        key={col.col}
                        className="relative overflow-hidden bg-[#0d0d12] border border-white/10 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl group hover:border-[#7000FF]/30 transition-all"
                      >
                        <div
                          className={`absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r ${
                            idx % 2 ===
                            0
                              ? "from-[#7000FF]"
                              : "from-zinc-600"
                          } to-transparent`}
                        />

                        <div className="flex justify-between items-start mb-6">

                          <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.4em] truncate max-w-[70%]">
                            {col.col}
                          </p>

                          {col.stats
                            ?.trend && (
                            <div
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] font-black ${
                                col
                                  .stats
                                  .trendDir ===
                                "up"
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : "bg-rose-500/10 text-rose-500"
                              }`}
                            >
                              {col
                                .stats
                                .trendDir ===
                              "up" ? (
                                <FiTrendingUp className="w-3 h-3" />
                              ) : (
                                <FiTrendingDown className="w-3 h-3" />
                              )}

                              {
                                col
                                  .stats
                                  .trend
                              }
                              %
                            </div>
                          )}
                        </div>

                        <div className="flex items-baseline gap-3 mb-8">

                          <span className="text-5xl md:text-6xl font-black tracking-tighter group-hover:text-[#a5b4fc] transition-colors">
                            {col.stats?.avg.toLocaleString(
                              undefined,
                              {
                                maximumFractionDigits: 1
                              }
                            )}
                          </span>

                          <span className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">
                            avg_val
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-8">

                          <div>

                            <p className="text-[8px] text-zinc-600 uppercase font-black mb-2">
                              Min_Range
                            </p>

                            <p className="text-[12px] font-bold text-zinc-300">
                              {col.stats?.min.toLocaleString()}
                            </p>
                          </div>

                          <div className="border-x border-white/5 px-3 text-center">

                            <p className="text-[8px] text-zinc-600 uppercase font-black mb-2">
                              Peak_Cap
                            </p>

                            <p className="text-[12px] font-bold text-zinc-300">
                              {col.stats?.max.toLocaleString()}
                            </p>
                          </div>

                          <div className="text-right">

                            <p className="text-[8px] text-zinc-600 uppercase font-black mb-2">
                              Net_Agg
                            </p>

                            <p className="text-[12px] font-bold text-[#7000FF] truncate">
                              {col.stats
                                ?.sum >
                              1e6
                                ? (
                                    col
                                      .stats
                                      .sum /
                                    1e6
                                  ).toFixed(
                                    1
                                  ) +
                                  "M"
                                : col.stats?.sum.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
              </div>

              {/* GRAPHS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">

                {numericCols.map(
                  (col, idx) => {
                    const defaultChartType =
                      ds.isDateLabel
                        ? "line"
                        : "bar";

                    const currentChartType =
                      localChartTypes[
                        `${ds.id}-${col.col}`
                      ] ||
                      defaultChartType;

                    const activeColor =
                      COLORS[
                        idx %
                          COLORS.length
                      ];

                    const chartData = {
                      labels:
                        ds.labels,

                      datasets: [
                        {
                          label:
                            col.col,

                          data:
                            col.chartValues,

                          borderColor:
                            activeColor,

                          backgroundColor:
                            currentChartType ===
                            "bar"
                              ? `${activeColor}CC`
                              : `${activeColor}15`,

                          borderWidth:
                            currentChartType ===
                            "bar"
                              ? 1
                              : 3,

                          borderRadius:
                            currentChartType ===
                            "bar"
                              ? 6
                              : 0,

                          minBarLength: 4,
                          tension: 0.3,

                          fill:
                            currentChartType ===
                            "line",

                          pointRadius:
                            ds.isDateLabel
                              ? 3
                              : 0
                        }
                      ]
                    };

                    return (
                      <div
                        key={`${col.col}-${refreshKey}`}
                        className="group relative border border-white/10 rounded-[3rem] p-8 md:p-12 bg-[#0a0a0f] shadow-2xl transition-all flex flex-col hover:border-white/20"
                      >

                        <div className="flex justify-between items-start mb-10">

                          <div className="min-w-0 pr-4">

                            <div className="flex items-center gap-3 mb-3">

                              <div
                                className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                                style={{
                                  backgroundColor:
                                    activeColor
                                }}
                              />

                              <h4 className="text-white text-[11px] font-black uppercase tracking-[0.5em] truncate">
                                {col.col}
                              </h4>
                            </div>

                            <p className="text-zinc-700 text-[10px] font-mono uppercase tracking-[0.3em]">
                              Mapped_By_
                              {ds.labelCol}
                            </p>
                          </div>

                          <div className="flex gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/5 shrink-0">

                            <button
                              onClick={() =>
                                setExpandedChart(
                                  {
                                    title:
                                      col.col,

                                    data:
                                      chartData,

                                    type:
                                      currentChartType
                                  }
                                )
                              }
                              className="p-2 text-zinc-500 hover:text-white transition-colors"
                            >
                              <FiMaximize2 className="w-5 h-5" />
                            </button>

                            <button
                              onClick={() =>
                                toggleLocalChartType(
                                  ds.id,
                                  col.col
                                )
                              }
                              className="p-2 text-zinc-500 hover:text-white transition-colors"
                            >
                              {currentChartType ===
                              "line" ? (
                                <FiBarChart2 className="w-5 h-5" />
                              ) : (
                                <FiTrendingUp className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="w-full aspect-[4/3] sm:aspect-[16/9] relative">

                          {currentChartType ===
                          "bar" ? (
                            <Bar
                              data={
                                chartData
                              }
                              options={
                                chartOptions
                              }
                            />
                          ) : (
                            <Line
                              data={
                                chartData
                              }
                              options={
                                chartOptions
                              }
                            />
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* PIE CHARTS */}
              {categoricalCols.length >
                0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mt-16">

                  {categoricalCols
                    .slice(0, 3)
                    .map(
                      (col) => (
                        <div
                          key={`${col.col}-${refreshKey}`}
                          className="p-10 md:p-14 border border-white/10 rounded-[3rem] bg-[#0d0d12] shadow-2xl relative overflow-hidden group hover:border-[#7000FF]/30 transition-all"
                        >

                          <div className="absolute top-6 right-8 px-4 py-1.5 bg-[#7000FF]/10 border border-[#7000FF]/20 rounded-full">

                            <span className="text-[8px] font-black text-[#7000FF] uppercase tracking-widest italic">
                              Categorical_Split
                            </span>
                          </div>

                          <div className="flex items-center gap-4 mb-10">

                            <div className="p-3 bg-white/5 rounded-xl border border-white/10">

                              <FiPieChart className="text-[#a5b4fc] w-5 h-5" />
                            </div>

                            <h4 className="text-white/50 text-[11px] font-black uppercase tracking-[0.4em] truncate pr-16">
                              {col.col}
                            </h4>
                          </div>

                          <div className="aspect-square relative w-full">

                            <Pie
                              data={{
                                labels:
                                  Object.keys(
                                    col.freq
                                  ),

                                datasets:
                                  [
                                    {
                                      data:
                                        Object.values(
                                          col.freq
                                        ),

                                      backgroundColor:
                                        COLORS,

                                      borderWidth:
                                        4,

                                      borderColor:
                                        "#0d0d12",

                                      hoverOffset:
                                        20
                                    }
                                  ]
                              }}
                              options={{
                                maintainAspectRatio:
                                  false,

                                plugins:
                                  {
                                    legend:
                                      {
                                        position:
                                          "bottom",

                                        labels:
                                          {
                                            color:
                                              "#666",

                                            font:
                                              {
                                                size: 9,
                                                weight:
                                                  "bold"
                                              },

                                            padding:
                                              20,

                                            usePointStyle:
                                              true
                                          }
                                      }
                                  }
                              }}
                            />
                          </div>
                        </div>
                      )
                    )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* EXPANDED CHART */}
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
              {expandedChart.title}
            </h2>

            <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-[4rem] p-10">

              {expandedChart.type ===
              "bar" ? (
                <Bar
                  data={
                    expandedChart.data
                  }
                  options={
                    chartOptions
                  }
                />
              ) : (
                <Line
                  data={
                    expandedChart.data
                  }
                  options={
                    chartOptions
                  }
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* SCROLL TO TOP */}
      {showScrollTop && (
        <button
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth"
            })
          }
          className="fixed bottom-10 right-10 z-[100] w-16 h-16 bg-white text-black rounded-full flex items-center justify-center border-8 border-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-90 transition-all"
        >
          <FiArrowUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};