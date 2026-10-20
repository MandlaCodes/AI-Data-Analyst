import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiX, FiDatabase, FiFileText, FiCheck, FiAlertTriangle, FiLoader, FiExternalLink, FiUploadCloud } from "react-icons/fi";
import { SiGooglesheets } from "react-icons/si";
import { FaFileExcel } from "react-icons/fa";

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

export const ImportModal = ({
  onClose,
  selectedApps = [],
  setSelectedApps,
  sheetsList = [],
  setSheetsList = () => {},
  selectedSheet,
  setSelectedSheet,
  setCsvToImport,
  csvToImport,
  onImport,
}) => {
  const initialSource = ["google_sheets", "excel", "other"].includes(selectedApps?.[0])
    ? selectedApps[0] : null;
  const [source, setSource] = useState(initialSource);
  const [loadingSource, setLoadingSource] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [sheetIds, setSheetIds] = useState([]);
  const [sheetNames, setSheetNames] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const requestVersion = useRef(0);
  const mounted = useRef(true);
  const initialized = useRef(false);
  const googlePickerRef = useRef(null);
  const [googlePickerOpen, setGooglePickerOpen] = useState(false);
  const [pickerButtonPosition, setPickerButtonPosition] = useState({ top: 12, right: 16 });

  // Anchor the close control just ABOVE the Google dialog, not in the
  // browser corner. Google inserts the picker outside our React tree.
  useEffect(() => {
    if (!googlePickerOpen) return;
    const updatePosition = () => {
      const dialog = document.querySelector('.picker-dialog');
      const iframe = document.querySelector('iframe[src*="picker"]');
      const element = dialog || iframe;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      if (rect.width < 200 || rect.height < 100) return;
      setPickerButtonPosition(prev => {
        const next = {
          top: Math.max(8, rect.top - 54),
          right: Math.max(8, window.innerWidth - rect.right),
        };
        return prev.top === next.top && prev.right === next.right ? prev : next;
      });
    };
    updatePosition();
    const interval = window.setInterval(updatePosition, 200);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', updatePosition);
    };
  }, [googlePickerOpen]);

  const closeGooglePicker = () => {
    try { googlePickerRef.current?.setVisible(false); } catch (error) {
      console.warn("Could not hide Google Picker:", error);
    }
    googlePickerRef.current = null;
    setGooglePickerOpen(false);
    setLoadingSource(null);
  };

  const chooseSource = (nextSource, openFile = true) => {
    requestVersion.current += 1;
    closeGooglePicker();
    setSource(nextSource);
    setSelectedApps([nextSource]);
    setErrorMessage(null);
    setLoadingSource(null);
    setSheetIds([]);
    setSheetNames([]);
    setSelectedSheet("");
    setSheetsList([]);
    setCsvToImport(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (nextSource === "other" && openFile) fileInputRef.current?.click();
    if (nextSource === "excel") loadExcel(requestVersion.current);
    if (nextSource === "google_sheets") openGooglePicker(requestVersion.current);
  };

  const loadExcel = async (version) => {
    setLoadingSource("excel");
    try {
      const token = localStorage.getItem("adt_token");
      if (!token) throw new Error("Please sign in again to access your workbooks.");
      const response = await fetch(`${API_BASE_URL}/excel/sheets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) throw new Error("Microsoft Account Not Linked");
      if (!response.ok) throw new Error("Could not load OneDrive workbooks. Please try again.");
      const data = await response.json();
      if (!mounted.current || version !== requestVersion.current) return;
      const files = Array.isArray(data.files) ? data.files : [];
      setSheetsList(files);
      if (!files.length) setErrorMessage("No Excel workbooks were found in your OneDrive account.");
    } catch (error) {
      if (mounted.current && version === requestVersion.current) setErrorMessage(error.message || "Could not load workbooks.");
    } finally {
      if (mounted.current && version === requestVersion.current) setLoadingSource(null);
    }
  };

  const openGooglePicker = async (version) => {
    setLoadingSource("google_sheets");
    try {
      const token = localStorage.getItem("adt_token");
      if (!token) throw new Error("Please sign in again to access Google Sheets.");
      if (!window.google?.picker) throw new Error("Google Picker is still loading. Click Google Sheets again in a moment.");
      const response = await fetch(`${API_BASE_URL}/google-token`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(response.status === 401 ? "Google Account Not Linked" : "Could not access Google Sheets. Please try again.");
      const data = await response.json();
      if (!data.access_token) throw new Error("Google access token was unavailable.");
      if (!mounted.current || version !== requestVersion.current) return;
      const picker = new window.google.picker.PickerBuilder()
        .setDeveloperKey(process.env.REACT_APP_GOOGLE_DEVELOPER_KEY)
        .setAppId(process.env.REACT_APP_GOOGLE_APP_ID)
        .setOAuthToken(data.access_token)
        .addView(new window.google.picker.DocsView(window.google.picker.ViewId.SPREADSHEETS))
        .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
        .setOrigin(window.location.protocol + "//" + window.location.host)
        .setCallback((result) => {
          if (!mounted.current || version !== requestVersion.current) return;
          if (result.action === window.google.picker.Action.PICKED) {
            const docs = Array.isArray(result.docs) ? result.docs : [];
            const nextIds = [...sheetIds];
            const nextNames = [...sheetNames];
            docs.forEach((doc) => {
              if (!nextIds.includes(doc.id)) {
                nextIds.push(doc.id);
                nextNames.push(doc.name || "Untitled spreadsheet");
              }
            });
            setSheetIds(nextIds);
            setSheetNames(nextNames);
            setSelectedSheet(nextNames.join(", "));
          }
          if (result.action === window.google.picker.Action.PICKED || result.action === window.google.picker.Action.CANCEL) {
            closeGooglePicker();
          }
        }).build();
      googlePickerRef.current = picker;
      picker.setVisible(true);
      setGooglePickerOpen(true);
      setLoadingSource(null);
    } catch (error) {
      if (mounted.current && version === requestVersion.current) {
        setErrorMessage(error.message || "Unable to open Google Picker.");
        setLoadingSource(null);
      }
    }
  };

  useEffect(() => {
    mounted.current = true;
    if (!initialized.current) {
      initialized.current = true;
      // Analytics has already selected the source. Load its content on arrival.
      // File inputs require a user gesture, so the upload button stays visible.
      if (initialSource === "excel") loadExcel(requestVersion.current);
      if (initialSource === "google_sheets") openGooglePicker(requestVersion.current);
    }
    return () => {
      mounted.current = false;
      requestVersion.current += 1;
      try { googlePickerRef.current?.setVisible(false); } catch (error) { /* already closed */ }
      googlePickerRef.current = null;
    };
    // Source selection is intentionally initialized once per modal mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrorMessage("Please choose a CSV file. Local Excel workbook import isn't supported yet.");
      setCsvToImport(null);
      return;
    }
    setCsvToImport(file);
    setErrorMessage(null);
  };

  const canImport = !isSubmitting && !loadingSource && (
    (source === "google_sheets" && sheetIds.length > 0) ||
    (source === "excel" && sheetIds.length > 0) ||
    (source === "other" && !!csvToImport)
  );

  const submit = async () => {
    if (!canImport) return;
    setIsSubmitting(true);
    try { await onImport(source === "other" ? [] : sheetIds, source === "other" ? [] : sheetNames); }
    finally { if (mounted.current) setIsSubmitting(false); }
  };

  const tile = (id, Icon, label, accent) => (
    <button type="button" onClick={() => chooseSource(id)} aria-pressed={source === id}
      className={`group flex min-h-[122px] flex-col items-center justify-center gap-3 rounded-[1.5rem] border-2 p-4 text-center transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 ${
        source === id ? accent : "border-white/10 bg-white/[0.035] text-slate-400 hover:border-white/30 hover:bg-white/[0.075] hover:text-white"
      }`}>
      <Icon size={29} className="transition-transform duration-200 group-hover:-translate-y-0.5" />
      <span className="text-[11px] font-bold leading-4">{label}</span>
      {source === id && <span className="text-[10px] font-semibold opacity-80">Selected</span>}
    </button>
  );

  const closeImportModal = () => {
    requestVersion.current += 1;
    closeGooglePicker();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-lg" onClick={closeImportModal} />
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFileChange} />
      <div role="dialog" aria-modal="true" aria-labelledby="import-modal-title" className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0c0c11] text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-6 sm:px-9">
          <div>
            <h2 id="import-modal-title" className="text-2xl font-extrabold tracking-tight">Import your data</h2>
            <p className="mt-2 text-sm text-slate-400">Choose where your data lives, then select what to analyze.</p>
          </div>
          <button type="button" onClick={closeImportModal} aria-label="Close import modal" className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"><FiX size={22} /></button>
        </div>
        <div className="space-y-6 overflow-y-auto px-6 py-6 sm:px-9">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {tile("google_sheets", SiGooglesheets, "Google Sheets", "border-emerald-500 bg-emerald-500/10 text-emerald-300")}
            {tile("excel", FaFileExcel, "Microsoft Excel", "border-blue-500 bg-blue-500/10 text-blue-300")}
            {tile("other", FiFileText, "Upload CSV", "border-purple-500 bg-purple-500/10 text-purple-300")}
          </div>

          {loadingSource && <div role="status" className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300"><FiLoader className="animate-spin text-purple-400" size={18} />{loadingSource === "excel" ? "Loading your OneDrive workbooks…" : "Opening Google Sheets…"}</div>}

          {errorMessage && <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            <div className="flex items-start gap-2"><FiAlertTriangle className="mt-0.5 shrink-0" /><span>{errorMessage}</span></div>
            {(errorMessage === "Google Account Not Linked" || errorMessage === "Microsoft Account Not Linked") && <button type="button" onClick={() => { onClose(); window.location.assign("/dashboard/integrations"); }} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-black hover:bg-slate-200">Go to Integrations <FiExternalLink /></button>}
          </div>}

          {source === "google_sheets" && !loadingSource && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="flex items-center justify-between gap-3"><h3 className="font-bold">Google spreadsheets</h3><button type="button" onClick={() => openGooglePicker(requestVersion.current)} className="rounded-lg bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/30">{sheetIds.length ? "Add spreadsheets" : "Choose spreadsheets"}</button></div>
            {sheetIds.length ? <div className="mt-4 space-y-2">{sheetIds.map((id, index) => <div key={id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"><span className="min-w-0 truncate">{sheetNames[index]}</span><button type="button" aria-label={`Remove ${sheetNames[index]}`} onClick={() => { const ids = sheetIds.filter((_, i) => i !== index); const names = sheetNames.filter((_, i) => i !== index); setSheetIds(ids); setSheetNames(names); setSelectedSheet(names.join(", ")); }} className="text-slate-400 hover:text-white"><FiX /></button></div>)}</div> : <p className="mt-3 text-sm text-slate-400">Select one or more spreadsheets using Google Picker.</p>}
          </div>}

          {source === "excel" && !loadingSource && <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
            <div className="flex items-center justify-between gap-3"><h3 className="font-bold">OneDrive workbooks</h3><button type="button" onClick={() => loadExcel(requestVersion.current)} className="rounded-lg bg-blue-500/20 px-4 py-2 text-xs font-bold text-blue-200 hover:bg-blue-500/30">Refresh</button></div>
            {sheetsList.length ? <div className="mt-4 max-h-52 space-y-2 overflow-y-auto">{sheetsList.map(file => <button type="button" key={file.id} onClick={() => { setSheetIds([file.id]); setSheetNames([file.name]); setSelectedSheet(file.name); }} className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${sheetIds.includes(file.id) ? "border-blue-500 bg-blue-500/20 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:border-blue-400/50"}`}><span className="flex min-w-0 items-center gap-3"><FaFileExcel className="shrink-0 text-blue-400" /><span className="truncate">{file.name}</span></span>{sheetIds.includes(file.id) && <FiCheck className="shrink-0 text-blue-300" />}</button>)}</div> : !errorMessage && <p className="mt-3 text-sm text-slate-400">No workbooks to display.</p>}
          </div>}

          {source === "other" && <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
            <h3 className="font-bold">Upload a CSV file</h3>
            <p className="mt-2 text-sm text-slate-400">Choose a CSV file from your device. You can change your selection before importing.</p>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-purple-400/40 bg-purple-500/15 px-5 py-3 text-sm font-bold text-purple-200 hover:bg-purple-500/25"><FiUploadCloud size={18} />{csvToImport ? "Choose a different file" : "Browse files"}</button>
            {csvToImport && <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"><span className="min-w-0 truncate">{csvToImport.name}</span><FiCheck className="shrink-0 text-emerald-400" /></div>}
          </div>}
        </div>
        <div className="border-t border-white/10 px-6 py-5 sm:px-9">
          <button type="button" disabled={!canImport} onClick={submit} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#6c4cff] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#5438dd] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500">{isSubmitting ? <FiLoader className="animate-spin" size={18} /> : <FiDatabase size={18} />}{isSubmitting ? "Importing…" : "Import selected data"}</button>
        </div>
      </div>
      {googlePickerOpen && createPortal(
        <button
          type="button"
          onClick={closeGooglePicker}
          aria-label="Close Google Sheets picker"
          title="Close Google Sheets picker"
          style={{ position: "fixed", top: pickerButtonPosition.top, right: pickerButtonPosition.right, zIndex: 2147483647 }}
          className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-2xl hover:bg-slate-100 focus-visible:outline focus-visible:outline-4 focus-visible:outline-purple-500"
        >
          <FiX size={20} /> Close Google Picker
        </button>,
        document.body
      )}
    </div>
  );
};
