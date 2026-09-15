/**
 * pages/Analytics.jsx - VERSION: METRIA AI HIGH-ENERGY
 * Full production file with Session Persistence and Neural Stream processing.
 * UPDATED: Edge-to-edge layout with synchronized vertical alignment anchors.
 * FIX: Removed SDK dependency; Updated Scopes Logic; Logical Gate for aiStorage.
 * UPDATE: Metria interactive analyst now waits for completed AI analysis.
 * UPDATE: Cross-analysis state persists safely without replacing React setter.
 * FIX: Dataset standby/broadcast toggles no longer wipe completed analysis.
 * FIX: Reactivation restores the canonical dataset from allDatasets.
 * FIX: Cross-analysis survives temporary dataset deselection/reselection.
 * UX: Interactive Metria analyst is now rendered inside Visualizer after the brief.
 */

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from "chart.js";

import { FaSpinner } from "react-icons/fa";

import {
    MdOutlineAnalytics,
    MdOutlineTableChart
} from "react-icons/md";

import {
    FiTrash2,
    FiPlus
} from "react-icons/fi";

import { WorkbenchHeader } from "../components/WorkbenchHeader";
import { Visualizer } from "../components/Visualizer";
import { ImportModal } from "../components/ImportModal";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const API_BASE_URL =
    "https://ai-data-analyst-backend-1nuw.onrender.com";

const AUTH_TOKEN_KEY = "adt_token";

export default function Analytics() {
    const userToken = localStorage.getItem(
        AUTH_TOKEN_KEY
    );

    // ============================================================
    // CORE DATA STATE
    // ============================================================

    const [allDatasets, setAllDatasets] =
        useState([]);

    const [activeDatasets, setActiveDatasets] =
        useState([]);

    const [chartType, setChartType] =
        useState("line");

    // ============================================================
    // AI ANALYSIS STATE
    // ============================================================

    const [analysisMode, setAnalysisMode] =
        useState("single");

    const [
        activeDatasetIndex,
        setActiveDatasetIndex
    ] = useState(0);

    const [
        crossAnalysis,
        setCrossAnalysis
    ] = useState(null);

    // ============================================================
    // UI LOGIC STATE
    // ============================================================

    const [showModal, setShowModal] =
        useState(false);

    const [isImporting, setIsImporting] =
        useState(false);

    const [
        isInitializing,
        setIsInitializing
    ] = useState(true);

    const [isSaving, setIsSaving] =
        useState(false);

    // ============================================================
    // IMPORT FLOW STATE
    // ============================================================

    const [
        selectedApps,
        setSelectedApps
    ] = useState([]);

    const [
        sheetsList,
        setSheetsList
    ] = useState([]);

    const [
        selectedSheet,
        setSelectedSheet
    ] = useState("");

    const [
        csvToImport,
        setCsvToImport
    ] = useState(null);

    const datasetColors = [
        "#bc13fe",
        "#22C55E",
        "#F97316",
        "#EAB308"
    ];

    /**
     * Prevent autosave from firing until the existing
     * server-side session has completely hydrated.
     */
    const hasHydratedSession =
        useRef(false);

    /**
     * Dataset activation/deactivation is a UI participation change.
     *
     * It must never destroy completed AI analysis.
     *
     * This ref prevents the temporary activeDatasets transition
     * from causing the general autosave to race against React state
     * while a dataset is being toggled.
     */
    const isTogglingDataset =
        useRef(false);

    const toggleSaveTimerRef =
        useRef(null);

    // ============================================================
    // DATA UTILITIES
    // ============================================================

    const sanitizeCellValue = (value) => {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "";
        }

        const str =
            String(value).trim();

        const numericValue =
            Number(
                str.replace(/,/g, "")
            );

        return (
            !isNaN(numericValue) &&
            str.length > 0
        )
            ? numericValue
            : str;
    };

    const calculateHealthScore = (
        dataset
    ) => {
        if (
            !dataset.data ||
            dataset.data.length < 2
        ) {
            return 0;
        }

        const rows =
            dataset.data.slice(1);

        const numericIdx =
            dataset.numericCols?.[0] ??
            0;

        let issues = 0;

        const vals = rows
            .map((r) =>
                sanitizeCellValue(
                    r[numericIdx]
                )
            )
            .filter(
                (v) =>
                    typeof v ===
                    "number"
            );

        const avg =
            vals.length > 0
                ? vals.reduce(
                      (a, b) =>
                          a + b,
                      0
                  ) /
                  vals.length
                : 0;

        rows.forEach((row) => {
            const val =
                sanitizeCellValue(
                    row[numericIdx]
                );

            if (
                val === "" ||
                val === null ||
                val === undefined
            ) {
                issues++;
            }

            if (
                typeof val ===
                    "number" &&
                val > avg * 5 &&
                avg !== 0
            ) {
                issues += 0.5;
            }
        });

        const score =
            Math.max(
                0,
                100 -
                    (
                        issues /
                        (
                            rows.length ||
                            1
                        )
                    ) *
                        100
            );

        return Math.round(score);
    };

    const parseCSVFile = async (
        file
    ) => {
        const text =
            await file.text();

        const rows = text
            .split(/\r?\n/)
            .filter(Boolean);

        return rows.map((r) =>
            r
                .split(
                    /,(?=(?:(?:[^"]*"){2})*[^"]*$)/
                )
                .map((c) =>
                    c
                        .trim()
                        .replace(
                            /^"|"$/g,
                            ""
                        )
                        .replace(
                            /""/g,
                            '"'
                        )
                )
        );
    };

    const detectNumericColumns = (
        values
    ) => {
        if (
            !values ||
            values.length < 2
        ) {
            return [];
        }

        return values[0]
            .map(
                (
                    _,
                    colIndex
                ) => {
                    const sample =
                        values
                            .slice(
                                1,
                                6
                            )
                            .map(
                                (
                                    r
                                ) =>
                                    sanitizeCellValue(
                                        r[
                                            colIndex
                                        ]
                                    )
                            );

                    return sample.some(
                        (v) =>
                            typeof v ===
                            "number"
                    )
                        ? colIndex
                        : null;
                }
            )
            .filter(
                (i) =>
                    i !== null
            );
    };

    const detectCategoryColumn = (
        values,
        numericIndexes
    ) => {
        if (
            !values ||
            !values[0]
        ) {
            return null;
        }

        for (
            let i = 0;
            i <
            values[0].length;
            i++
        ) {
            if (
                !numericIndexes.includes(
                    i
                )
            ) {
                return {
                    colIndex: i,
                    header:
                        values[0][i]
                };
            }
        }

        return null;
    };

    const computeMetrics = (
        values,
        numericIndexes
    ) => {
        const metrics = {};

        if (
            !values ||
            !values[0]
        ) {
            return metrics;
        }

        numericIndexes.forEach(
            (idx) => {
                const colName =
                    values[0][idx];

                const arr = values
                    .slice(1)
                    .map((r) =>
                        sanitizeCellValue(
                            r[idx]
                        )
                    )
                    .filter(
                        (n) =>
                            typeof n ===
                            "number"
                    );

                const total =
                    arr.reduce(
                        (a, b) =>
                            a + b,
                        0
                    );

                metrics[colName] = {
                    total,

                    avg:
                        total /
                        (
                            arr.length ||
                            1
                        ),

                    max:
                        arr.length > 0
                            ? Math.max(
                                  ...arr
                              )
                            : 0,

                    min:
                        arr.length > 0
                            ? Math.min(
                                  ...arr
                              )
                            : 0,

                    count:
                        arr.length
                };
            }
        );

        return metrics;
    };

    /**
     * Normalises spreadsheet API responses into worksheet objects.
     *
     * New production routes may return every worksheet in `sheets`,
     * while older routes return one legacy `values` array. Supporting
     * both shapes keeps existing imports working during deployment.
     */
    const normalizeWorkbookSheets = (
        responseData,
        fallbackName = "Spreadsheet"
    ) => {
        const payload = responseData || {};

        const returnedSheets =
            Array.isArray(payload.sheets)
                ? payload.sheets
                : Array.isArray(payload.worksheets)
                  ? payload.worksheets
                  : [];

        const normalizedSheets = returnedSheets
            .map((sheet, index) => {
                if (Array.isArray(sheet)) {
                    return {
                        name: `Sheet ${index + 1}`,
                        values: sheet
                    };
                }

                const values =
                    sheet?.values ||
                    sheet?.data ||
                    sheet?.rows ||
                    [];

                return {
                    name:
                        sheet?.name ||
                        sheet?.title ||
                        sheet?.sheet_name ||
                        sheet?.worksheet_name ||
                        `Sheet ${index + 1}`,
                    values:
                        Array.isArray(values)
                            ? values
                            : []
                };
            })
            .filter(
                (sheet) =>
                    Array.isArray(sheet.values) &&
                    sheet.values.length > 0
            );

        if (normalizedSheets.length > 0) {
            return normalizedSheets;
        }

        if (
            Array.isArray(payload.values) &&
            payload.values.length > 0
        ) {
            return [
                {
                    name:
                        payload.sheet_name ||
                        payload.worksheet_name ||
                        fallbackName,
                    values: payload.values
                }
            ];
        }

        return [];
    };

    const buildImportedDataset = ({
        values,
        name,
        id,
        color,
        sourceType,
        sourceId,
        sheetName,
        workbookName
    }) => {
        if (
            !Array.isArray(values) ||
            values.length === 0
        ) {
            return null;
        }

        const maxColumns = Math.max(
            0,
            ...values.map((row) =>
                Array.isArray(row)
                    ? row.length
                    : 0
            )
        );

        if (maxColumns === 0) {
            return null;
        }

        const rectangular = values.map((row) => {
            const safeRow = Array.isArray(row)
                ? [...row]
                : [];

            while (safeRow.length < maxColumns) {
                safeRow.push("");
            }

            return safeRow;
        });

        while (
            rectangular.length > 0 &&
            rectangular[
                rectangular.length - 1
            ].every(
                (cell) =>
                    cell === "" ||
                    cell === null ||
                    cell === undefined
            )
        ) {
            rectangular.pop();
        }

        if (rectangular.length === 0) {
            return null;
        }

        const cleaned = rectangular.map(
            (row, rowIndex) =>
                rowIndex === 0
                    ? row.map((cell) =>
                          cell === null ||
                          cell === undefined
                              ? ""
                              : String(cell).trim()
                      )
                    : row.map(
                          sanitizeCellValue
                      )
        );

        const numeric =
            detectNumericColumns(cleaned);

        const category =
            detectCategoryColumn(
                cleaned,
                numeric
            );

        return {
            id,
            name,
            color,
            rows: Math.max(
                cleaned.length - 1,
                0
            ),
            cols:
                cleaned[0]?.length || 0,
            data: cleaned,
            numericCols: numeric,
            metrics: computeMetrics(
                cleaned,
                numeric
            ),
            categoryCol: category,
            aiStorage: null,
            sourceType,
            sourceId,
            sheetName,
            workbookName
        };
    };

    // ============================================================
    // PAGE STATE FACTORY
    // ============================================================

    /**
     * Creates the exact state object persisted by both
     * manual save and autosave.
     *
     * Cross analysis is included here so refresh/navigation
     * restores the completed cross brief.
     */
    const buildPageState = (
        crossOverride =
            crossAnalysis,
        activeOverride =
            activeDatasets
    ) => ({
        allDatasets,

        activeDatasetIds:
            activeOverride.map(
                (d) => d.id
            ),

        chartType,

        analysisMode,

        activeDatasetIndex,

        crossAnalysis:
            crossOverride,

        uiContext: {
            showModal,
            selectedApps,
            selectedSheet
        }
    });

    // ============================================================
    // LIVE SYNC
    // ============================================================

    const handleLiveSync = async () => {
        if (
            !userToken ||
            activeDatasets.length ===
                0
        ) {
            return;
        }

        try {
            const updatedDatasets =
                await Promise.all(
                    activeDatasets.map(
                        async (ds) => {
                            const remoteSourceId =
                                ds.sourceId || null;

                            const remoteSourceType =
                                ds.sourceType || null;

                            if (
                                remoteSourceId &&
                                (
                                    remoteSourceType ===
                                        "google_sheets" ||
                                    remoteSourceType ===
                                        "excel"
                                )
                            ) {
                                const endpoint =
                                    remoteSourceType ===
                                    "excel"
                                        ? `${API_BASE_URL}/excel/sheets/${remoteSourceId}`
                                        : `${API_BASE_URL}/google/sheets/${remoteSourceId}`;

                                const res =
                                    await axios.get(
                                        endpoint,
                                        {
                                            headers:
                                                {
                                                    Authorization:
                                                        `Bearer ${userToken}`
                                                }
                                        }
                                    );

                                const workbookSheets =
                                    normalizeWorkbookSheets(
                                        res.data,
                                        ds.workbookName ||
                                            ds.name ||
                                            "Spreadsheet"
                                    );

                                const matchingSheet =
                                    workbookSheets.find(
                                        (sheet) =>
                                            sheet.name ===
                                            ds.sheetName
                                    ) ||
                                    workbookSheets[0];

                                if (
                                    matchingSheet?.values
                                ) {
                                    const importedRows =
                                        matchingSheet.values;

                                    const cleaned =
                                        importedRows.map(
                                            (
                                                row,
                                                idx
                                            ) =>
                                                idx ===
                                                0
                                                    ? row
                                                    : row.map(
                                                          sanitizeCellValue
                                                      )
                                        );

                                    const numeric =
                                        detectNumericColumns(
                                            cleaned
                                        );

                                    const category =
                                        detectCategoryColumn(
                                            cleaned,
                                            numeric
                                        );

                                    return {
                                        ...ds,

                                        rows:
                                            cleaned.length -
                                            1,

                                        cols:
                                            cleaned[0]
                                                ?.length ||
                                            0,

                                        data:
                                            cleaned,

                                        numericCols:
                                            numeric,

                                        metrics:
                                            computeMetrics(
                                                cleaned,
                                                numeric
                                            ),

                                        categoryCol:
                                            category
                                    };
                                }
                            }

                            return ds;
                        }
                    )
                );

            setActiveDatasets(
                updatedDatasets
            );

            setAllDatasets(
                (prev) =>
                    prev.map(
                        (d) => {
                            const match =
                                updatedDatasets.find(
                                    (
                                        u
                                    ) =>
                                        u.id ===
                                        d.id
                                );

                            if (!match) {
                                return d;
                            }

                            return {
                                ...d,
                                ...match,

                                aiStorage:
                                    match.aiStorage ??
                                    d.aiStorage ??
                                    null
                            };
                        }
                    )
            );
        } catch (e) {
            console.error(
                "Live sync failed:",
                e
            );
        }
    };

    useEffect(() => {
        const pollInterval =
            setInterval(
                () => {
                    handleLiveSync();
                },
                60000
            );

        return () =>
            clearInterval(
                pollInterval
            );

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        activeDatasets,
        userToken
    ]);

    // ============================================================
    // SESSION LOAD / HYDRATION
    // ============================================================

    useEffect(() => {
        const loadSession =
            async () => {
                if (!userToken) {
                    hasHydratedSession.current =
                        true;

                    setIsInitializing(
                        false
                    );

                    return;
                }

                try {
                    const res =
                        await axios.get(
                            `${API_BASE_URL}/analysis/current`,
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${userToken}`
                                }
                            }
                        );

                    if (
                        res.data
                            ?.page_state
                    ) {
                        const {
                            allDatasets:
                                loadedDatasets,

                            activeDatasetIds,

                            chartType:
                                loadedChartType,

                            analysisMode:
                                loadedAnalysisMode,

                            activeDatasetIndex:
                                loadedActiveDatasetIndex,

                            crossAnalysis:
                                loadedCrossAnalysis,

                            uiContext
                        } =
                            res.data
                                .page_state;

                        const safeLoadedDatasets =
                            Array.isArray(
                                loadedDatasets
                            )
                                ? loadedDatasets
                                : [];

                        setAllDatasets(
                            safeLoadedDatasets
                        );

                        setChartType(
                            loadedChartType ||
                                "line"
                        );

                        setAnalysisMode(
                            loadedAnalysisMode ||
                                "single"
                        );

                        setActiveDatasetIndex(
                            typeof loadedActiveDatasetIndex ===
                                "number"
                                ? loadedActiveDatasetIndex
                                : 0
                        );

                        setCrossAnalysis(
                            loadedCrossAnalysis ||
                                null
                        );

                        if (
                            Array.isArray(
                                activeDatasetIds
                            )
                        ) {
                            const active =
                                safeLoadedDatasets.filter(
                                    (d) =>
                                        activeDatasetIds.includes(
                                            d.id
                                        )
                                );

                            setActiveDatasets(
                                active
                            );
                        } else {
                            setActiveDatasets(
                                safeLoadedDatasets
                            );
                        }

                        if (
                            uiContext
                        ) {
                            setShowModal(
                                !!uiContext.showModal
                            );

                            setSelectedApps(
                                uiContext.selectedApps ||
                                    []
                            );

                            setSelectedSheet(
                                uiContext.selectedSheet ||
                                    ""
                            );
                        }
                    }
                } catch (e) {
                    console.error(
                        "Session load failed:",
                        e
                    );
                } finally {
                    hasHydratedSession.current =
                        true;

                    setIsInitializing(
                        false
                    );
                }
            };

        loadSession();
    }, [userToken]);

    // ============================================================
    // GENERAL AUTOSAVE
    // ============================================================

    useEffect(() => {
        if (
            !hasHydratedSession.current ||
            !userToken ||
            isInitializing ||
            isTogglingDataset.current
        ) {
            return;
        }

        const autosave =
            async () => {
                setIsSaving(true);

                try {
                    const pageState =
                        buildPageState();

                    await axios.post(
                        `${API_BASE_URL}/analysis/save`,
                        {
                            name:
                                "Autosave Dashboard",

                            page_state:
                                pageState
                        },
                        {
                            headers:
                                {
                                    Authorization:
                                        `Bearer ${userToken}`
                                }
                        }
                    );
                } catch (e) {
                    console.warn(
                        "Autosave failed",
                        e
                    );
                } finally {
                    setIsSaving(
                        false
                    );
                }
            };

        const timer =
            setTimeout(
                autosave,
                1500
            );

        return () =>
            clearTimeout(timer);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        allDatasets,
        activeDatasets,
        chartType,
        analysisMode,
        activeDatasetIndex,
        crossAnalysis,
        showModal,
        selectedApps,
        selectedSheet,
        userToken,
        isInitializing
    ]);

    // ============================================================
    // IMMEDIATE CROSS ANALYSIS SAVE
    // ============================================================

    useEffect(() => {
        if (
            !hasHydratedSession.current ||
            isInitializing ||
            !userToken ||
            !crossAnalysis ||
            analysisMode !==
                "cross"
        ) {
            return;
        }

        const saveCrossAnalysis =
            async () => {
                try {
                    const pageState =
                        buildPageState(
                            crossAnalysis
                        );

                    await axios.post(
                        `${API_BASE_URL}/analysis/save`,
                        {
                            name:
                                "Cross Analysis Autosave",

                            page_state:
                                pageState
                        },
                        {
                            headers:
                                {
                                    Authorization:
                                        `Bearer ${userToken}`
                                }
                        }
                    );

                    console.log(
                        "[Cross Analysis] Saved successfully"
                    );
                } catch (e) {
                    console.error(
                        "[Cross Analysis] Immediate save failed:",
                        e
                    );
                }
            };

        saveCrossAnalysis();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [crossAnalysis]);

    // ============================================================
    // RESTORE CROSS MODE WHEN DATASETS RETURN
    // ============================================================

    useEffect(() => {
        if (
            activeDatasets.length > 1 &&
            crossAnalysis &&
            analysisMode !==
                "cross"
        ) {
            setAnalysisMode(
                "cross"
            );
        }
    }, [
        activeDatasets,
        crossAnalysis,
        analysisMode
    ]);

    // ============================================================
    // AI ACTIONS
    // ============================================================

    const handleAIUpdate = (
        datasetId,
        aiData
    ) => {
        const applyUpdate =
            (list) =>
                list.map(
                    (ds) =>
                        ds.id ===
                        datasetId
                            ? {
                                  ...ds,

                                  aiStorage:
                                      aiData
                              }
                            : ds
                );

        setAllDatasets(
            (prev) =>
                applyUpdate(
                    prev
                )
        );

        setActiveDatasets(
            (prev) =>
                applyUpdate(
                    prev
                )
        );
    };

    const handleAnalysisModeChange = (
        mode
    ) => {
        setAnalysisMode(
            mode
        );

        if (
            mode ===
            "individual"
        ) {
            setActiveDatasetIndex(
                0
            );
        }
    };

    const handleActiveDatasetChange = (
        index
    ) => {
        setActiveDatasetIndex(
            index
        );
    };

    // ============================================================
    // DATASET ACTIVE / STANDBY TOGGLE
    // ============================================================

    const handleToggleDataset = (
        dataset
    ) => {
        const isActive =
            activeDatasets.some(
                (item) =>
                    item.id ===
                    dataset.id
            );

        isTogglingDataset.current =
            true;

        if (
            toggleSaveTimerRef.current
        ) {
            clearTimeout(
                toggleSaveTimerRef.current
            );
        }

        let nextActiveDatasets;

        if (isActive) {
            nextActiveDatasets =
                activeDatasets.filter(
                    (item) =>
                        item.id !==
                        dataset.id
                );
        } else {
            /**
             * IMPORTANT:
             *
             * Restore the canonical copy from allDatasets.
             *
             * That copy contains aiStorage and any previously
             * completed analysis state.
             */
            const storedDataset =
                allDatasets.find(
                    (item) =>
                        item.id ===
                        dataset.id
                ) ||
                dataset;

            nextActiveDatasets = [
                ...activeDatasets,
                storedDataset
            ];
        }

        setActiveDatasets(
            nextActiveDatasets
        );

        if (
            nextActiveDatasets.length ===
            0
        ) {
            setActiveDatasetIndex(
                0
            );
        } else {
            setActiveDatasetIndex(
                (prevIndex) =>
                    Math.min(
                        prevIndex,
                        nextActiveDatasets.length -
                            1
                    )
            );
        }

        /**
         * Persist the selected active dataset IDs independently
         * from React's delayed autosave cycle.
         *
         * Cross analysis is deliberately retained here.
         *
         * Going Standby is not the same thing as deleting or
         * importing a new source.
         */
        toggleSaveTimerRef.current =
            setTimeout(
                async () => {
                    try {
                        if (
                            userToken &&
                            hasHydratedSession.current
                        ) {
                            const pageState =
                                buildPageState(
                                    crossAnalysis,
                                    nextActiveDatasets
                                );

                            await axios.post(
                                `${API_BASE_URL}/analysis/save`,
                                {
                                    name:
                                        "Dataset Selection Autosave",

                                    page_state:
                                        pageState
                                },
                                {
                                    headers:
                                        {
                                            Authorization:
                                                `Bearer ${userToken}`
                                        }
                                }
                            );
                        }
                    } catch (e) {
                        console.warn(
                            "Dataset selection save failed:",
                            e
                        );
                    } finally {
                        isTogglingDataset.current =
                            false;
                    }
                },
                250
            );
    };

    // ============================================================
    // CLEAN UP TOGGLE TIMER
    // ============================================================

    useEffect(() => {
        return () => {
            if (
                toggleSaveTimerRef.current
            ) {
                clearTimeout(
                    toggleSaveTimerRef.current
                );
            }
        };
    }, []);

    // ============================================================
    // SAVE
    // ============================================================

    const handleSave = async () => {
        if (!userToken) {
            return;
        }

        setIsSaving(true);

        try {
            const pageState =
                buildPageState();

            await axios.post(
                `${API_BASE_URL}/analysis/save`,
                {
                    name:
                        `Manual Save ${new Date().toLocaleTimeString()}`,

                    page_state:
                        pageState
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${userToken}`
                    }
                }
            );

            alert(
                "Workspace snapshot saved!"
            );
        } catch (e) {
            console.error(
                "Manual save failed:",
                e
            );

            alert(
                "Save failed."
            );
        } finally {
            setIsSaving(
                false
            );
        }
    };

    // ============================================================
    // IMPORT
    // ============================================================

    const importSelected = async (
        manualIds = [],
        manualNames = []
    ) => {
        setIsImporting(true);

        try {
            let newDatasets = [];

            // ====================================================
            // GOOGLE SHEETS / EXCEL FILES IN GOOGLE DRIVE
            // ====================================================
            // The backend can now return every worksheet. Each
            // worksheet becomes its own Metria dataset so tables do
            // not get flattened together or silently ignored.
            // ====================================================

            if (
                selectedApps.includes(
                    "google_sheets"
                ) &&
                Array.isArray(manualIds)
            ) {
                const workbookResults =
                    await Promise.all(
                        manualIds.map(
                            async (
                                sourceId,
                                workbookIndex
                            ) => {
                                const res =
                                    await axios.get(
                                        `${API_BASE_URL}/google/sheets/${sourceId}`,
                                        {
                                            headers: {
                                                Authorization:
                                                    `Bearer ${userToken}`
                                            }
                                        }
                                    );

                                const workbookName =
                                    manualNames[
                                        workbookIndex
                                    ] ||
                                    res.data?.title ||
                                    "Google Spreadsheet";

                                const sheets =
                                    normalizeWorkbookSheets(
                                        res.data,
                                        workbookName
                                    );

                                return sheets.map(
                                    (
                                        sheet,
                                        sheetIndex
                                    ) => ({
                                        sourceId,
                                        workbookName,
                                        sheet,
                                        workbookIndex,
                                        sheetIndex
                                    })
                                );
                            }
                        )
                    );

                const flattened =
                    workbookResults.flat();

                newDatasets = flattened
                    .map((entry, index) => {
                        const multipleSheets =
                            flattened.filter(
                                (item) =>
                                    item.sourceId ===
                                    entry.sourceId
                            ).length > 1;

                        const displayName =
                            multipleSheets
                                ? `${entry.workbookName} — ${entry.sheet.name}`
                                : entry.workbookName;

                        return buildImportedDataset(
                            {
                                values:
                                    entry.sheet
                                        .values,
                                name:
                                    displayName,
                                id:
                                    `google:${entry.sourceId}:${entry.sheet.name}:${Date.now()}:${index}`,
                                color:
                                    datasetColors[
                                        (
                                            allDatasets.length +
                                            index
                                        ) %
                                            datasetColors.length
                                    ],
                                sourceType:
                                    "google_sheets",
                                sourceId:
                                    entry.sourceId,
                                sheetName:
                                    entry.sheet.name,
                                workbookName:
                                    entry.workbookName
                            }
                        );
                    })
                    .filter(Boolean);
            }

            // ====================================================
            // MICROSOFT EXCEL / ONEDRIVE
            // ====================================================

            else if (
                selectedApps.includes(
                    "excel"
                ) &&
                Array.isArray(manualIds)
            ) {
                const workbookResults =
                    await Promise.all(
                        manualIds.map(
                            async (
                                sourceId,
                                workbookIndex
                            ) => {
                                const res =
                                    await axios.get(
                                        `${API_BASE_URL}/excel/sheets/${sourceId}`,
                                        {
                                            headers: {
                                                Authorization:
                                                    `Bearer ${userToken}`
                                            }
                                        }
                                    );

                                const workbookName =
                                    manualNames[
                                        workbookIndex
                                    ] ||
                                    res.data?.title ||
                                    "Excel Workbook";

                                const sheets =
                                    normalizeWorkbookSheets(
                                        res.data,
                                        workbookName
                                    );

                                return sheets.map(
                                    (
                                        sheet,
                                        sheetIndex
                                    ) => ({
                                        sourceId,
                                        workbookName,
                                        sheet,
                                        workbookIndex,
                                        sheetIndex
                                    })
                                );
                            }
                        )
                    );

                const flattened =
                    workbookResults.flat();

                newDatasets = flattened
                    .map((entry, index) => {
                        const multipleSheets =
                            flattened.filter(
                                (item) =>
                                    item.sourceId ===
                                    entry.sourceId
                            ).length > 1;

                        const displayName =
                            multipleSheets
                                ? `${entry.workbookName} — ${entry.sheet.name}`
                                : entry.workbookName;

                        return buildImportedDataset(
                            {
                                values:
                                    entry.sheet
                                        .values,
                                name:
                                    displayName,
                                id:
                                    `excel:${entry.sourceId}:${entry.sheet.name}:${Date.now()}:${index}`,
                                color:
                                    datasetColors[
                                        (
                                            allDatasets.length +
                                            index
                                        ) %
                                            datasetColors.length
                                    ],
                                sourceType:
                                    "excel",
                                sourceId:
                                    entry.sourceId,
                                sheetName:
                                    entry.sheet.name,
                                workbookName:
                                    entry.workbookName
                            }
                        );
                    })
                    .filter(Boolean);
            }

            // ====================================================
            // CSV / OTHER
            // ====================================================

            else if (
                selectedApps.includes(
                    "other"
                ) &&
                csvToImport
            ) {
                const sourceName =
                    csvToImport.name.replace(
                        /\.csv$/i,
                        ""
                    );

                const importedRows =
                    await parseCSVFile(
                        csvToImport
                    );

                const newDataset =
                    buildImportedDataset({
                        values: importedRows,
                        name: sourceName,
                        id: Date.now(),
                        color:
                            datasetColors[
                                allDatasets.length %
                                    datasetColors.length
                            ],
                        sourceType: "csv",
                        sourceId: null,
                        sheetName: null,
                        workbookName:
                            sourceName
                    });

                if (newDataset) {
                    newDatasets = [
                        newDataset
                    ];
                }
            }

            if (newDatasets.length > 0) {
                setAllDatasets(
                    (prev) => [
                        ...prev,
                        ...newDatasets
                    ]
                );

                setActiveDatasets(
                    (prev) => [
                        ...prev,
                        ...newDatasets
                    ]
                );
            }

            /**
             * New imported data changes the actual business context,
             * so the previous cross analysis should no longer unlock.
             */
            setCrossAnalysis(null);
            setActiveDatasetIndex(0);
            setShowModal(false);
        } catch (e) {
            console.error(
                "Import error:",
                e
            );

            const backendDetail =
                e?.response?.data?.detail;

            const message =
                typeof backendDetail ===
                "string"
                    ? backendDetail
                    : backendDetail
                          ?.message ||
                      "Import failed.";

            alert(message);
        } finally {
            setIsImporting(false);
            setSelectedApps([]);
            setCsvToImport(null);
            setSelectedSheet("");
        }
    };

    // ============================================================
    // DELETE DATASET
    // ============================================================

    const handleDeleteDataset = (
        datasetId
    ) => {
        setAllDatasets(
            (prev) =>
                prev.filter(
                    (item) =>
                        item.id !==
                        datasetId
                )
        );

        setActiveDatasets(
            (prev) =>
                prev.filter(
                    (item) =>
                        item.id !==
                        datasetId
                )
        );

        /**
         * Deletion genuinely changes the underlying data,
         * so the completed cross analysis is no longer valid.
         */
        setCrossAnalysis(
            null
        );

        setActiveDatasetIndex(
            0
        );
    };

    // ============================================================
    // ANALYSIS READINESS
    // ============================================================

    const readyToVisualize =
        activeDatasets.filter(
            (ds) =>
                Boolean(
                    ds.aiStorage
                )
        );

    /**
     * MULTI / INDIVIDUAL:
     * Every active dataset must have its own brief.
     */
    const allActiveDatasetsAnalyzed =
        activeDatasets.length >
            0 &&
        activeDatasets.every(
            (ds) =>
                Boolean(
                    ds.aiStorage
                )
        );

    /**
     * SINGLE:
     * One dataset must have completed its brief.
     */
    const singleDatasetAnalyzed =
        activeDatasets.length ===
            1 &&
        Boolean(
            activeDatasets[0]
                ?.aiStorage
        );

    /**
     * CROSS:
     * Unlock once a real cross-analysis response exists.
     */
    const crossAnalysisReady =
        activeDatasets.length >
            1 &&
        analysisMode ===
            "cross" &&
        Boolean(
            crossAnalysis
        );

    /**
     * This value is now passed down into Visualizer.
     *
     * Visualizer will own the actual placement of
     * MetriaFollowUp directly after the Strategic Brief.
     */
    const metriaAnalystReady =
        activeDatasets.length ===
        1
            ? singleDatasetAnalyzed
            : analysisMode ===
                "cross"
              ? crossAnalysisReady
              : allActiveDatasetsAnalyzed;

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="bg-black text-slate-200 w-full min-h-screen font-sans selection:bg-purple-500/30 overflow-x-hidden">

            {/* ==================================================== */}
            {/* INITIALIZATION / IMPORT OVERLAY                       */}
            {/* ==================================================== */}

            {(isInitializing ||
                isImporting) && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl">

                    <div className="relative mb-6">

                        <div className="absolute inset-0 bg-purple-500/20 blur-3xl animate-pulse" />

                        <FaSpinner
                            size={60}
                            className="text-purple-500 animate-spin relative"
                        />

                    </div>

                    <p className="text-sm font-black tracking-[0.4em] text-white uppercase animate-pulse">

                        {isImporting
                            ? "Processing Stream..."
                            : "MetriaAI Initializing..."
                        }

                    </p>

                </div>
            )}

            <div className="w-full">

                {/* ================================================= */}
                {/* HEADER                                            */}
                {/* ================================================= */}

                <div className="pt-8 px-6 lg:px-10">

                    <WorkbenchHeader
                        isSaving={
                            isSaving
                        }

                        onImport={() =>
                            setShowModal(
                                true
                            )
                        }

                        onSave={
                            handleSave
                        }

                        onOpenAI={() => {}}
                    />

                </div>

                {allDatasets.length >
                0 ? (

                    <div className="mt-12 space-y-12">

                        {/* ========================================= */}
                        {/* NEURAL STREAMS HEADER                     */}
                        {/* ========================================= */}

                        <div className="flex items-center gap-6 px-6 lg:px-10">

                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.8em] whitespace-nowrap">
                                Neural Streams
                            </h3>

                            <div className="h-[1px] flex-1 bg-white/5" />

                        </div>

                        {/* ========================================= */}
                        {/* DATASET CARDS                             */}
                        {/* ========================================= */}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6 lg:px-10">

                            {allDatasets.map(
                                (ds) => {
                                    const isActive =
                                        activeDatasets.some(
                                            (a) =>
                                                a.id ===
                                                ds.id
                                        );

                                    const health =
                                        calculateHealthScore(
                                            ds
                                        );

                                    return (
                                        <div
                                            key={
                                                ds.id
                                            }

                                            onClick={() =>
                                                handleToggleDataset(
                                                    ds
                                                )
                                            }

                                            className={`group relative overflow-hidden border rounded-[2rem] p-8 transition-all duration-500 cursor-pointer flex flex-col min-h-[220px] ${
                                                isActive
                                                    ? "bg-purple-900/20 border-purple-500/40 shadow-[0_0_50px_rgba(188,19,254,0.1)] scale-[1.02]"
                                                    : "bg-white/[0.03] border-white/10 hover:border-white/20"
                                            }`}
                                        >

                                            <div
                                                className="absolute inset-0 opacity-40 pointer-events-none"

                                                style={{
                                                    background:
                                                        isActive
                                                            ? "radial-gradient(circle at 10% 10%, rgba(188, 19, 254, 0.3), transparent 80%)"
                                                            : "radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.05), transparent 80%)"
                                                }}
                                            />

                                            <div className="relative z-10 flex-1">

                                                <div className="flex justify-between items-start mb-6">

                                                    <div
                                                        className={`p-4 rounded-2xl border transition-all duration-500 ${
                                                            isActive
                                                                ? "bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/20"
                                                                : "bg-white border-white text-black"
                                                        }`}
                                                    >
                                                        <MdOutlineTableChart
                                                            size={
                                                                22
                                                            }
                                                        />
                                                    </div>

                                                    <span
                                                        className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${
                                                            health >
                                                            85
                                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                                : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                                        }`}
                                                    >
                                                        {
                                                            health
                                                        }
                                                        %
                                                        {" "}
                                                        Integrity
                                                    </span>

                                                </div>

                                                <div className="mb-2">

                                                    <div className="text-xl font-black text-white uppercase tracking-tighter truncate leading-tight mb-1">
                                                        {
                                                            ds.name
                                                        }
                                                    </div>

                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
                                                        {
                                                            ds.rows
                                                        }
                                                        {" "}
                                                        Active Nodes
                                                    </div>

                                                </div>

                                            </div>

                                            <div className="relative z-10 flex items-center justify-between pt-5 border-t border-white/5">

                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">

                                                    <div
                                                        className={`w-2 h-2 rounded-full ${
                                                            isActive
                                                                ? "bg-purple-500 animate-pulse"
                                                                : "bg-slate-700"
                                                        }`}
                                                    />

                                                    {isActive
                                                        ? "Broadcasting"
                                                        : "Standby"
                                                    }

                                                </span>

                                                <FiTrash2
                                                    onClick={(
                                                        e
                                                    ) => {
                                                        e.stopPropagation();

                                                        handleDeleteDataset(
                                                            ds.id
                                                        );
                                                    }}

                                                    className="text-slate-600 hover:text-red-400 transition-colors"

                                                    size={
                                                        18
                                                    }
                                                />

                                            </div>

                                        </div>
                                    );
                                }
                            )}

                            {/* ===================================== */}
                            {/* ADD STREAM                            */}
                            {/* ===================================== */}

                            <button
                                onClick={() =>
                                    setShowModal(
                                        true
                                    )
                                }

                                className="h-full min-h-[220px] rounded-[2rem] border-2 border-dashed border-white/5 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all flex flex-col items-center justify-center gap-4 text-slate-600 hover:text-purple-400 group"
                            >

                                <div className="p-4 rounded-full border-2 border-dashed border-slate-800 group-hover:border-purple-500/50 transition-all">

                                    <FiPlus
                                        size={28}
                                    />

                                </div>

                                <span className="text-[11px] font-black uppercase tracking-[0.5em]">
                                    Sync Stream
                                </span>

                            </button>

                        </div>

                        {/* ========================================= */}
                        {/* VISUALIZER                                */}
                        {/* ========================================= */}

                        <div className="px-6 lg:px-10 pb-12">

                            <Visualizer
                                activeDatasets={
                                    activeDatasets
                                }

                                readyDatasets={
                                    readyToVisualize
                                }

                                chartType={
                                    chartType
                                }

                                chartTypeSet={
                                    setChartType
                                }

                                authToken={
                                    userToken
                                }

                                onAIUpdate={
                                    handleAIUpdate
                                }

                                // ---------------------------------
                                // AI ANALYSIS MODE
                                // ---------------------------------

                                analysisMode={
                                    analysisMode
                                }

                                setAnalysisMode={
                                    handleAnalysisModeChange
                                }

                                // ---------------------------------
                                // INDIVIDUAL ANALYSIS
                                // ---------------------------------

                                activeDatasetIndex={
                                    activeDatasetIndex
                                }

                                setActiveDatasetIndex={
                                    handleActiveDatasetChange
                                }

                                // ---------------------------------
                                // CROSS ANALYSIS
                                // ---------------------------------

                                crossAnalysis={
                                    crossAnalysis
                                }

                                setCrossAnalysis={
                                    setCrossAnalysis
                                }

                                // ---------------------------------
                                // INTERACTIVE ANALYST
                                // ---------------------------------
                                // Visualizer will use this to place
                                // the REAL MetriaFollowUp directly
                                // after the Strategic Brief.
                                interactiveAnalystReady={
                                    metriaAnalystReady
                                }
                            />

                        </div>

                    </div>

                ) : (

                    // =============================================
                    // EMPTY STATE
                    // =============================================

                    <div className="px-6 lg:px-10 pb-12 mt-12">

                        <div className="text-center py-52 bg-white/[0.01] border-y border-white/5 relative overflow-hidden rounded-[3rem]">

                            <div className="absolute inset-0 bg-radial-gradient from-purple-500/10 to-transparent opacity-40 pointer-events-none" />

                            <MdOutlineAnalytics
                                size={100}
                                className="mx-auto text-slate-900 mb-8"
                            />

                            <h3 className="text-5xl font-black text-white uppercase tracking-tighter mb-6">
                                Neural Link Disconnected
                            </h3>

                            <button
                                onClick={() =>
                                    setShowModal(
                                        true
                                    )
                                }

                                className="px-16 py-6 bg-purple-600 text-white rounded-full font-black text-xs uppercase tracking-[0.6em] transition-all hover:scale-105 shadow-2xl shadow-purple-500/20"
                            >
                                Initialize Stream
                            </button>

                        </div>

                    </div>
                )}

            </div>

            {/* ==================================================== */}
            {/* IMPORT MODAL                                         */}
            {/* ==================================================== */}

            {showModal && (
                <ImportModal
                    onClose={() => {
                        setShowModal(
                            false
                        );

                        setSelectedApps(
                            []
                        );

                        setSheetsList(
                            []
                        );

                        setCsvToImport(
                            null
                        );

                        setSelectedSheet(
                            ""
                        );
                    }}

                    selectedApps={
                        selectedApps
                    }

                    setSelectedApps={
                        setSelectedApps
                    }

                    sheetsList={
                        sheetsList
                    }

                    setSheetsList={
                        setSheetsList
                    }

                    selectedSheet={
                        selectedSheet
                    }

                    setSelectedSheet={
                        setSelectedSheet
                    }

                    setCsvToImport={
                        setCsvToImport
                    }

                    csvToImport={
                        csvToImport
                    }

                    onImport={(
                        ids,
                        names
                    ) =>
                        importSelected(
                            ids,
                            names
                        )
                    }
                />
            )}

        </div>
    );
}