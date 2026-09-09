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
import { MetriaFollowUp } from "../components/MetriaFollowUp";

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

    // ============================================================
    // PAGE STATE FACTORY
    // ============================================================

    const buildPageState = (
        crossOverride =
            crossAnalysis,
        activeOverride =
            activeDatasets
    ) => ({
        /**
         * allDatasets is the canonical store.
         *
         * AI results remain attached here even while a dataset
         * is temporarily placed in standby.
         */
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
                            if (
                                (
                                    ds.id &&
                                    typeof ds.id ===
                                        "string"
                                ) ||
                                ds.id > 1000
                            ) {
                                const endpoint =
                                    ds.name?.includes(
                                        "Excel"
                                    ) ||
                                    String(
                                        ds.id
                                    ).length >
                                        10
                                        ? `${API_BASE_URL}/excel/sheets/${ds.id}`
                                        : `${API_BASE_URL}/google/sheets/${ds.id}`;

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

                                if (
                                    res.data
                                        ?.values
                                ) {
                                    const importedRows =
                                        res.data
                                            .values;

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

                            /**
                             * Preserve AI storage from the canonical
                             * dataset if a sync response ever lacks it.
                             */
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

        /**
         * Always write AI output into allDatasets.
         *
         * allDatasets is the permanent/canonical copy.
         */
        setAllDatasets(
            (prev) =>
                applyUpdate(
                    prev
                )
        );

        /**
         * Mirror it into the active copy for immediate rendering.
         */
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

        /**
         * IMPORTANT:
         *
         * Do NOT destroy crossAnalysis simply because the user
         * switches viewing modes.
         *
         * Cross analysis is only invalidated when the underlying
         * business data itself changes (import/delete/new analysis),
         * not when the user changes what they are viewing.
         */
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

        /**
         * A toggle means:
         *
         * "include/exclude this dataset from the current view"
         *
         * It does NOT mean:
         *
         * "delete this dataset's analysis".
         *
         * Therefore:
         * - aiStorage remains in allDatasets
         * - crossAnalysis remains untouched
         * - analysisMode remains untouched
         */

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
             * Restore from allDatasets rather than blindly using
             * the card's object.
             *
             * allDatasets owns the permanent aiStorage result.
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

        /**
         * Keep the index valid without wiping analysis.
         */
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
         * Persist the final participation state directly.
         *
         * Crucially, the saved page still contains allDatasets,
         * including every dataset's aiStorage, plus crossAnalysis.
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
        setIsImporting(
            true
        );

        try {
            // ====================================================
            // GOOGLE SHEETS
            // ====================================================

            if (
                selectedApps.includes(
                    "google_sheets"
                ) &&
                Array.isArray(
                    manualIds
                )
            ) {
                const importPromises =
                    manualIds.map(
                        async (
                            id,
                            index
                        ) => {
                            const res =
                                await axios.get(
                                    `${API_BASE_URL}/google/sheets/${id}`,
                                    {
                                        headers:
                                            {
                                                Authorization:
                                                    `Bearer ${userToken}`
                                            }
                                    }
                                );

                            if (
                                res.data
                                    ?.values
                            ) {
                                const importedRows =
                                    res.data
                                        .values;

                                const sourceName =
                                    manualNames[
                                        index
                                    ] ||
                                    res.data
                                        .title ||
                                    "Neural Stream";

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
                                    id:
                                        Date.now() +
                                        index,

                                    name:
                                        sourceName,

                                    color:
                                        datasetColors[
                                            (
                                                allDatasets.length +
                                                index
                                            ) %
                                                datasetColors.length
                                        ],

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
                                        category,

                                    aiStorage:
                                        null
                                };
                            }

                            return null;
                        }
                    );

                const newDatasets =
                    (
                        await Promise.all(
                            importPromises
                        )
                    ).filter(
                        (ds) =>
                            ds !== null
                    );

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

            // ====================================================
            // EXCEL
            // ====================================================

            else if (
                selectedApps.includes(
                    "excel"
                ) &&
                Array.isArray(
                    manualIds
                )
            ) {
                const importPromises =
                    manualIds.map(
                        async (
                            id,
                            index
                        ) => {
                            const res =
                                await axios.get(
                                    `${API_BASE_URL}/excel/sheets/${id}`,
                                    {
                                        headers:
                                            {
                                                Authorization:
                                                    `Bearer ${userToken}`
                                            }
                                    }
                                );

                            if (
                                res.data
                                    ?.values
                            ) {
                                const importedRows =
                                    res.data
                                        .values;

                                const sourceName =
                                    manualNames[
                                        index
                                    ] ||
                                    "Excel Stream";

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
                                    id:
                                        Date.now() +
                                        index,

                                    name:
                                        sourceName,

                                    color:
                                        datasetColors[
                                            (
                                                allDatasets.length +
                                                index
                                            ) %
                                                datasetColors.length
                                        ],

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
                                        category,

                                    aiStorage:
                                        null
                                };
                            }

                            return null;
                        }
                    );

                const newDatasets =
                    (
                        await Promise.all(
                            importPromises
                        )
                    ).filter(
                        (ds) =>
                            ds !== null
                    );

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

                if (
                    importedRows.length >
                    0
                ) {
                    const cleaned =
                        importedRows.map(
                            (
                                row,
                                idx
                            ) =>
                                idx === 0
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

                    const newDataset = {
                        id:
                            Date.now(),

                        name:
                            sourceName,

                        color:
                            datasetColors[
                                allDatasets.length %
                                    datasetColors.length
                            ],

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
                            category,

                        aiStorage:
                            null
                    };

                    setAllDatasets(
                        (prev) => [
                            ...prev,
                            newDataset
                        ]
                    );

                    setActiveDatasets(
                        (prev) => [
                            ...prev,
                            newDataset
                        ]
                    );
                }
            }

            /**
             * Importing genuinely introduces new business data,
             * so an existing cross-analysis is no longer guaranteed
             * to describe the current dataset collection.
             */
            setCrossAnalysis(
                null
            );

            setActiveDatasetIndex(
                0
            );

            setShowModal(
                false
            );
        } catch (e) {
            console.error(
                "Import error:",
                e
            );

            alert(
                "Import failed."
            );
        } finally {
            setIsImporting(
                false
            );

            setSelectedApps(
                []
            );

            setCsvToImport(
                null
            );

            setSelectedSheet(
                ""
            );
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
         * DELETE is intentionally different from standby.
         *
         * The underlying dataset has genuinely been removed,
         * so the old cross-analysis is no longer valid.
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

    const allActiveDatasetsAnalyzed =
        activeDatasets.length >
            0 &&
        activeDatasets.every(
            (ds) =>
                Boolean(
                    ds.aiStorage
                )
        );

    const singleDatasetAnalyzed =
        activeDatasets.length ===
            1 &&
        Boolean(
            activeDatasets[0]
                ?.aiStorage
        );

    const crossAnalysisReady =
        activeDatasets.length >
            1 &&
        analysisMode ===
            "cross" &&
        Boolean(
            crossAnalysis
        );

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

                            {/* ADD STREAM */}

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

                                /**
                                 * Keep this as the real React setter.
                                 */
                                setCrossAnalysis={
                                    setCrossAnalysis
                                }
                            />

                        </div>

                        {/* ========================================= */}
                        {/* INTERACTIVE METRIA ANALYST                */}
                        {/* ========================================= */}

                        {metriaAnalystReady && (
                            <MetriaFollowUp
                                activeDatasets={
                                    activeDatasets
                                }

                                activeDataset={
                                    analysisMode ===
                                    "cross"
                                        ? null
                                        : activeDatasets[
                                              activeDatasetIndex
                                          ] ||
                                          activeDatasets[
                                              activeDatasets.length -
                                                  1
                                          ]
                                }

                                analysisMode={
                                    analysisMode
                                }

                                crossAnalysis={
                                    crossAnalysis
                                }

                                authToken={
                                    userToken
                                }

                                aiAnalysisReady={
                                    metriaAnalystReady
                                }
                            />
                        )}

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