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

const AUTH_TOKEN_KEY = "adt\_token";

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
// WORKBOOK INGESTION
// ============================================================

const normalizeMatrix = (values = []) => {
    if (!Array.isArray(values)) {
        return [];
    }

    return values
        .filter((row) => Array.isArray(row))
        .map((row, rowIndex) =>
            rowIndex === 0
                ? row
                : row.map(sanitizeCellValue)
        );
};

const getPrimaryAnalyticalTable = (responseData = {}) => {
    const detectedTables =
        Array.isArray(responseData.detected_tables)
            ? responseData.detected_tables
            : [];

    const firstDetectedTable =
        detectedTables.find(
            (table) =>
                Array.isArray(table?.headers) &&
                table.headers.length > 0 &&
                Array.isArray(table?.rows) &&
                table.rows.length > 0
        );

    if (firstDetectedTable) {
        return {
            table: firstDetectedTable,
            matrix: normalizeMatrix([
                firstDetectedTable.headers,
                ...firstDetectedTable.rows
            ])
        };
    }

    const sheets =
        Array.isArray(responseData.sheets)
            ? responseData.sheets
            : [];

    const firstNonEmptySheet =
        sheets.find(
            (sheet) =>
                Array.isArray(sheet?.values) &&
                sheet.values.length > 0
        );

    if (firstNonEmptySheet) {
        return {
            table: null,
            matrix: normalizeMatrix(
                firstNonEmptySheet.values
            )
        };
    }

    return {
        table: null,
        matrix: normalizeMatrix(
            responseData.values || []
        )
    };
};

const buildWorkbookDataset = ({
    responseData,
    sourceId,
    sourceName,
    sourceType,
    color,
    previousDataset = null
}) => {
    const sheets =
        Array.isArray(responseData?.sheets)
            ? responseData.sheets
            : [];

    const detectedTables =
        Array.isArray(responseData?.detected_tables)
            ? responseData.detected_tables
            : sheets.flatMap(
                  (sheet) =>
                      Array.isArray(sheet?.tables)
                          ? sheet.tables
                          : []
              );

    const { table, matrix } =
        getPrimaryAnalyticalTable({
            ...responseData,
            detected_tables:
                detectedTables
        });

    const numeric =
        detectNumericColumns(
            matrix
        );

    const category =
        detectCategoryColumn(
            matrix,
            numeric
        );

    const workbookSummary =
        responseData?.workbook || {
            sheet_count:
                responseData?.sheet_count ??
                sheets.length,
            table_count:
                detectedTables.length,
            raw_row_count:
                responseData?.total_rows ??
                sheets.reduce(
                    (total, sheet) =>
                        total +
                        (
                            sheet?.row_count ??
                            sheet?.values?.length ??
                            0
                        ),
                    0
                )
        };

    return {
        id:
            `${sourceType}:${sourceId}`,

        sourceId,
        sourceType,

        name:
            sourceName ||
            responseData?.title ||
            previousDataset?.name ||
            "Workbook",

        workbookName:
            responseData?.title ||
            sourceName ||
            previousDataset?.workbookName ||
            "Workbook",

        isWorkbook:
            true,

        color:
            previousDataset?.color ||
            color,

        sheets,
        detected_tables:
            detectedTables,

        available_sheets:
            responseData?.available_sheets ||
            sheets.map(
                (sheet) => sheet.name
            ),

        workbook:
            workbookSummary,

        sheetCount:
            workbookSummary?.sheet_count ??
            sheets.length,

        tableCount:
            workbookSummary?.table_count ??
            detectedTables.length,

        primaryTableId:
            table?.id ||
            null,

        primarySheetName:
            table?.sheet_name ||
            responseData?.sheet_name ||
            null,

        rows:
            Math.max(
                matrix.length - 1,
                0
            ),

        cols:
            matrix[0]?.length ||
            0,

        data:
            matrix,

        numericCols:
            numeric,

        metrics:
            computeMetrics(
                matrix,
                numeric
            ),

        categoryCol:
            category,

        aiStorage:
            previousDataset?.aiStorage ||
            null,

        ingestionVersion:
            responseData?.ingestion_version ||
            "2.0"
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
        crossAnalysis
) => ({
    allDatasets,

    activeDatasetIds:
        activeDatasets.map(
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
        activeDatasets.length === 0
    ) {
        return;
    }

    try {
        const updatedDatasets =
            await Promise.all(
                activeDatasets.map(
                    async (ds) => {
                        if (
                            !ds?.isWorkbook ||
                            !ds?.sourceId ||
                            !ds?.sourceType
                        ) {
                            return ds;
                        }

                        const endpoint =
                            ds.sourceType ===
                            "excel_onedrive"
                                ? `${API_BASE_URL}/excel/sheets/${ds.sourceId}`
                                : `${API_BASE_URL}/google/sheets/${ds.sourceId}`;

                        const res =
                            await axios.get(
                                endpoint,
                                {
                                    headers: {
                                        Authorization:
                                            `Bearer ${userToken}`
                                    }
                                }
                            );

                        return buildWorkbookDataset({
                            responseData:
                                res.data,
                            sourceId:
                                ds.sourceId,
                            sourceName:
                                ds.name,
                            sourceType:
                                ds.sourceType,
                            color:
                                ds.color,
                            previousDataset:
                                ds
                        });
                    }
                )
            );

        setActiveDatasets(
            updatedDatasets
        );

        setAllDatasets(
            (prev) =>
                prev.map(
                    (dataset) => {
                        const match =
                            updatedDatasets.find(
                                (updated) =>
                                    updated.id ===
                                    dataset.id
                            );

                        return (
                            match ||
                            dataset
                        );
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

                    setAllDatasets(
                        loadedDatasets ||
                            []
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

                    /**
                     * IMPORTANT:
                     *
                     * This restores the cross-analysis brief itself.
                     * We do NOT clear it during session hydration.
                     */
                    setCrossAnalysis(
                        loadedCrossAnalysis ||
                            null
                    );

                    if (
                        Array.isArray(
                            activeDatasetIds
                        ) &&
                        Array.isArray(
                            loadedDatasets
                        )
                    ) {
                        const active =
                            loadedDatasets.filter(
                                (d) =>
                                    activeDatasetIds.includes(
                                        d.id
                                    )
                            );

                        setActiveDatasets(
                            active
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
                /**
                 * This MUST happen after the server load attempt,
                 * otherwise blank initial React state could
                 * overwrite the persisted dashboard.
                 */
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
        isInitializing
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

/**
 * IMPORTANT FIX:
 *
 * Visualizer receives the REAL React setCrossAnalysis setter.
 *
 * We do persistence separately here.
 *
 * This prevents the successful cross-analysis result from
 * disappearing because the setter contract was replaced by
 * an async callback.
 */
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

    // Intentionally triggered by completed cross analysis.
    // General autosave handles all other state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [crossAnalysis]);

// ============================================================

// RESTORE CROSS MODE WHEN DATASETS RETURN
// ============================================================

useEffect(() => {
if (
activeDatasets.length > 1 &&
crossAnalysis &&
analysisMode !== "cross"
) {
setAnalysisMode("cross");
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

    /**
     * Only clear cross analysis if the user deliberately
     * switches AWAY from cross mode.
     *
     * Refresh hydration does not call this handler,
     * so persisted cross analysis survives refresh.
     */
    if (
        mode !==
        "cross"
    ) {
        setCrossAnalysis(
            null
        );
    }

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

/**
 * Changing which datasets participate changes the cross-analysis
 * context. Therefore an old cross result must be invalidated.
 */

const handleToggleDataset = (
dataset
) => {
const isActive =
activeDatasets.some(
(item) =>
item.id ===
dataset.id
);

setActiveDatasets(
    (prev) =>
        isActive
            ? prev.filter(
                  (item) =>
                      item.id !==
                      dataset.id
              )
            : [
                  ...prev,
                  dataset
              ]
);
setActiveDatasetIndex(
    0
);

};

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
        const importWorkbookFiles =
            async (
                sourceType,
                endpointPrefix
            ) => {
                const imported =
                    await Promise.all(
                        manualIds.map(
                            async (
                                sourceId,
                                index
                            ) => {
                                const res =
                                    await axios.get(
                                        `${API_BASE_URL}/${endpointPrefix}/${sourceId}`,
                                        {
                                            headers: {
                                                Authorization:
                                                    `Bearer ${userToken}`
                                            }
                                        }
                                    );

                                return buildWorkbookDataset({
                                    responseData:
                                        res.data,
                                    sourceId,
                                    sourceName:
                                        manualNames[index] ||
                                        res.data?.title,
                                    sourceType,
                                    color:
                                        datasetColors[
                                            (
                                                allDatasets.length +
                                                index
                                            ) %
                                                datasetColors.length
                                        ]
                                });
                            }
                        )
                    );

                const valid =
                    imported.filter(
                        (dataset) =>
                            dataset &&
                            (
                                dataset.data.length > 0 ||
                                dataset.sheets.length > 0
                            )
                    );

                setAllDatasets(
                    (prev) => {
                        const incomingIds =
                            new Set(
                                valid.map(
                                    (dataset) =>
                                        dataset.id
                                )
                            );

                        return [
                            ...prev.filter(
                                (dataset) =>
                                    !incomingIds.has(
                                        dataset.id
                                    )
                            ),
                            ...valid
                        ];
                    }
                );

                setActiveDatasets(
                    (prev) => {
                        const incomingIds =
                            new Set(
                                valid.map(
                                    (dataset) =>
                                        dataset.id
                                )
                            );

                        return [
                            ...prev.filter(
                                (dataset) =>
                                    !incomingIds.has(
                                        dataset.id
                                    )
                            ),
                            ...valid
                        ];
                    }
                );
            };

        if (
            selectedApps.includes(
                "google_sheets"
            ) &&
            Array.isArray(manualIds)
        ) {
            await importWorkbookFiles(
                "google_drive",
                "google/sheets"
            );
        } else if (
            selectedApps.includes(
                "excel"
            ) &&
            Array.isArray(manualIds)
        ) {
            await importWorkbookFiles(
                "excel_onedrive",
                "excel/sheets"
            );
        } else if (
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
                importedRows.length > 0
            ) {
                const cleaned =
                    normalizeMatrix(
                        importedRows
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
                        Math.max(
                            cleaned.length - 1,
                            0
                        ),

                    cols:
                        cleaned[0]?.length ||
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
                        null,

                    isWorkbook:
                        false
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

        setCrossAnalysis(null);
        setActiveDatasetIndex(0);
        setShowModal(false);
    } catch (e) {
        console.error(
            "Import error:",
            e
        );

        alert(
            "Import failed."
        );
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
     * Dataset combination changed.
     * Existing cross-analysis is no longer valid.
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
 * every active dataset must have its own brief.
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
 * one dataset must have completed its brief.
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
 * only unlock once a real cross-analysis response exists.
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
 * Controls MetriaFollowUp rendering.
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
    <div className="w-full min-h-screen bg-[#f7f8fc] text-[#111827] font-sans selection:bg-purple-500/20 overflow-x-hidden">

        {/* ====================================================
            INITIALIZATION / IMPORT OVERLAY
        ==================================================== */}

        {(isInitializing || isImporting) && (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0b0911]/95 backdrop-blur-xl">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-purple-500/20 blur-3xl animate-pulse" />

                    <FaSpinner
                        size={48}
                        className="text-purple-500 animate-spin relative"
                    />
                </div>

                <p className="text-[12px] font-bold tracking-[0.18em] text-white uppercase">
                    {isImporting
                        ? "Processing your data..."
                        : "Preparing your workspace..."}
                </p>
            </div>
        )}

        <div className="w-full">

            {/* ====================================================
                HEADER
            ==================================================== */}

            <div className="px-6 pt-7 lg:px-10 lg:pt-8">
                <div className="max-w-[1480px] mx-auto">
                    <WorkbenchHeader
                        isSaving={isSaving}
                        onImport={() => setShowModal(true)}
                        onSave={handleSave}
                        onOpenAI={() => {}}
                    />
                </div>
            </div>

            {allDatasets.length > 0 ? (
                <div className="px-6 lg:px-10 pb-10">

                    <div className="max-w-[1480px] mx-auto">

                        {/* ====================================================
                            DATA SOURCES
                        ==================================================== */}

                        <section className="mt-7">

                            <div className="flex items-end justify-between gap-6 mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="w-7 h-7 rounded-lg border border-purple-200 bg-purple-50 flex items-center justify-center">
                                            <MdOutlineTableChart
                                                size={14}
                                                className="text-purple-600"
                                            />
                                        </div>

                                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple-600">
                                            Data sources
                                        </span>
                                    </div>

                                    <h2 className="text-[22px] md:text-[24px] font-bold tracking-[-0.035em] text-[#111827] leading-tight">
                                        Your connected data
                                    </h2>

                                    <p className="mt-1 text-[12px] md:text-[13px] text-slate-500 leading-relaxed">
                                        Select the datasets Metria should use in the live analysis below.
                                    </p>
                                </div>

                                <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-[10px] font-semibold text-slate-500">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />

                                    {activeDatasets.length} active
                                </div>
                            </div>

                            {/* ====================================================
                                DATASET CARDS
                            ==================================================== */}

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

                                {allDatasets.map((ds) => {
                                    const isActive = activeDatasets.some(
                                        (a) => a.id === ds.id
                                    );

                                    const health = calculateHealthScore(ds);

                                    return (
                                        <div
                                            key={ds.id}
                                            onClick={() =>
                                                handleToggleDataset(ds)
                                            }
                                            className={`
                                                group relative overflow-hidden
                                                min-h-[154px]
                                                rounded-[16px]
                                                border
                                                p-5
                                                cursor-pointer
                                                transition-all duration-200
                                                ${
                                                    isActive
                                                        ? "bg-white border-purple-300 shadow-[0_8px_24px_rgba(108,76,255,0.08)]"
                                                        : "bg-white border-slate-200 hover:border-purple-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
                                                }
                                            `}
                                        >
                                            {isActive && (
                                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-purple-600" />
                                            )}

                                            <div className="relative z-10 h-full flex flex-col">

                                                <div className="flex items-start justify-between gap-3">

                                                    <div
                                                        className={`
                                                            w-9 h-9
                                                            rounded-[10px]
                                                            flex items-center justify-center
                                                            border
                                                            transition-colors
                                                            ${
                                                                isActive
                                                                    ? "bg-purple-600 border-purple-600 text-white"
                                                                    : "bg-purple-50 border-purple-100 text-purple-600"
                                                            }
                                                        `}
                                                    >
                                                        <MdOutlineTableChart size={17} />
                                                    </div>

                                                    <span
                                                        className={`
                                                            inline-flex items-center
                                                            px-2 py-1
                                                            rounded-md
                                                            text-[9px]
                                                            font-bold
                                                            ${
                                                                health > 85
                                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                                    : "bg-amber-50 text-amber-700 border border-amber-100"
                                                            }
                                                        `}
                                                    >
                                                        {health}% integrity
                                                    </span>
                                                </div>

                                                <div className="mt-4 flex-1">
                                                    <h3 className="text-[15px] font-bold text-[#111827] tracking-[-0.02em] truncate">
                                                        {ds.name}
                                                    </h3>

                                                    <p className="mt-1 text-[10px] font-medium text-slate-500">
                                                        {ds.rows} active nodes
                                                    </p>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">

                                                    <span
                                                        className={`
                                                            inline-flex items-center gap-2
                                                            text-[9px]
                                                            font-bold
                                                            ${
                                                                isActive
                                                                    ? "text-purple-700"
                                                                    : "text-slate-400"
                                                            }
                                                        `}
                                                    >
                                                        <span
                                                            className={`
                                                                w-1.5 h-1.5 rounded-full
                                                                ${
                                                                    isActive
                                                                        ? "bg-emerald-500"
                                                                        : "bg-slate-300"
                                                                }
                                                            `}
                                                        />

                                                        {isActive
                                                            ? "Active in analysis"
                                                            : "Not selected"}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteDataset(ds.id);
                                                        }}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                        aria-label={`Delete ${ds.name}`}
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* ADD DATA SOURCE */}

                                <button
                                    type="button"
                                    onClick={() => setShowModal(true)}
                                    className="
                                        min-h-[154px]
                                        rounded-[16px]
                                        border border-dashed border-slate-300
                                        bg-white/60
                                        hover:bg-white
                                        hover:border-purple-300
                                        hover:shadow-[0_8px_24px_rgba(15,23,42,0.04)]
                                        transition-all duration-200
                                        flex flex-col
                                        items-center justify-center
                                        gap-3
                                        text-slate-500
                                        hover:text-purple-600
                                        group
                                    "
                                >
                                    <div className="
                                        w-9 h-9
                                        rounded-[10px]
                                        border border-slate-200
                                        bg-white
                                        flex items-center justify-center
                                        group-hover:border-purple-200
                                        group-hover:bg-purple-50
                                        transition-colors
                                    ">
                                        <FiPlus size={17} />
                                    </div>

                                    <div className="text-center">
                                        <div className="text-[11px] font-bold text-[#344054] group-hover:text-purple-700">
                                            Add data source
                                        </div>

                                        <div className="mt-0.5 text-[9px] text-slate-400">
                                            Import another dataset
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </section>

                        {/* ====================================================
                            ANALYSIS DIVIDER
                        ==================================================== */}

                        <div className="flex items-center gap-4 mt-8 mb-5">
                            <div className="h-px flex-1 bg-slate-200" />

                            <div className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.13em] text-slate-500">
                                <span className="w-6 h-6 rounded-lg border border-purple-100 bg-purple-50 flex items-center justify-center">
                                    <MdOutlineAnalytics
                                        size={12}
                                        className="text-purple-600"
                                    />
                                </span>

                                Live analysis
                            </div>

                            <div className="h-px flex-1 bg-slate-200" />
                        </div>

                        {/* ====================================================
                            VISUALIZER
                        ==================================================== */}

                        <div className="w-full">
                            <Visualizer
                                activeDatasets={activeDatasets}
                                readyDatasets={readyToVisualize}
                                chartType={chartType}
                                chartTypeSet={setChartType}
                                authToken={userToken}
                                onAIUpdate={handleAIUpdate}
                                analysisMode={analysisMode}
                                setAnalysisMode={handleAnalysisModeChange}
                                activeDatasetIndex={activeDatasetIndex}
                                setActiveDatasetIndex={handleActiveDatasetChange}
                                crossAnalysis={crossAnalysis}
                                setCrossAnalysis={setCrossAnalysis}
                                interactiveAnalystReady={metriaAnalystReady}
                            />
                        </div>
                    </div>
                </div>
            ) : (

                /* ====================================================
                    EMPTY STATE
                ==================================================== */

                <div className="px-6 lg:px-10 pb-12">
                    <div className="max-w-[1480px] mx-auto">

                        <div className="
                            mt-8
                            min-h-[430px]
                            flex flex-col
                            items-center justify-center
                            text-center
                            px-6 py-16
                            bg-white
                            border border-slate-200
                            rounded-[20px]
                            shadow-[0_8px_30px_rgba(15,23,42,0.04)]
                        ">
                            <div className="
                                w-14 h-14
                                rounded-[16px]
                                bg-purple-50
                                border border-purple-100
                                flex items-center justify-center
                                mb-5
                            ">
                                <MdOutlineAnalytics
                                    size={26}
                                    className="text-purple-600"
                                />
                            </div>

                            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple-600 mb-2">
                                Analytics
                            </div>

                            <h3 className="text-[26px] md:text-[30px] font-bold tracking-[-0.04em] text-[#111827]">
                                Connect your first dataset
                            </h3>

                            <p className="mt-3 max-w-[470px] text-[13px] leading-6 text-slate-500">
                                Import business data to start generating analytics,
                                visualizations and Metria intelligence.
                            </p>

                            <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                className="
                                    mt-6
                                    inline-flex items-center justify-center gap-2
                                    h-11 px-5
                                    rounded-[11px]
                                    bg-purple-600
                                    hover:bg-purple-700
                                    text-white
                                    text-[11px]
                                    font-bold
                                    shadow-[0_7px_18px_rgba(108,76,255,0.18)]
                                    transition-all
                                "
                            >
                                <FiPlus size={15} />
                                Import data
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* ====================================================
            IMPORT MODAL
        ==================================================== */}

        {showModal && (
            <ImportModal
                onClose={() => {
                    setShowModal(false);
                    setSelectedApps([]);
                    setSheetsList([]);
                    setCsvToImport(null);
                    setSelectedSheet("");
                }}
                selectedApps={selectedApps}
                setSelectedApps={setSelectedApps}
                sheetsList={sheetsList}
                setSheetsList={setSheetsList}
                selectedSheet={selectedSheet}
                setSelectedSheet={setSelectedSheet}
                setCsvToImport={setCsvToImport}
                csvToImport={csvToImport}
                onImport={(ids, names) =>
                    importSelected(ids, names)
                }
            />
        )}
    </div>
);
}