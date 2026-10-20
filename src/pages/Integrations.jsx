import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowRight, CheckCircle2, Database, FileSpreadsheet, Upload,
  RefreshCw, XCircle, ShieldCheck, Link2, Unplug, AlertTriangle
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";
const AUTH_TOKEN_KEY = "adt_token";
const ANALYTICS_ROUTE = "/dashboard/analytics";
const INTEGRATIONS_ROUTE = "/dashboard/integrations";

const SOURCES = [
  {
    id: "google_sheets",
    title: "Google Sheets",
    description: "Connect your Google account and choose the spreadsheets you want Metria to analyze.",
    Icon: Database,
    accent: "purple",
  },
  {
    id: "excel",
    title: "Microsoft Excel",
    description: "Connect your Microsoft account to analyze workbooks stored in your cloud account.",
    Icon: FileSpreadsheet,
    accent: "blue",
  },
];

export default function IntegrationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [connectedApps, setConnectedApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [disconnectTarget, setDisconnectTarget] = useState(null);

  const fetchConnectedApps = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) throw new Error("Your session has expired. Please sign in again.");
      const response = await fetch(`${API_BASE_URL}/connected-apps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(response.status === 401
          ? "Your session has expired. Please sign in again."
          : "Couldn't load your connected accounts. Please try again.");
      }
      const data = await response.json();
      const apps = [];
      if (data.google_sheets) apps.push({ id: "google_sheets", lastSync: data.google_sheets_last_sync });
      if (data.excel) apps.push({ id: "excel", lastSync: data.excel_last_sync });
      setConnectedApps(apps);
      return apps;
    } catch (error) {
      console.error("[Metria integrations]", error);
      setStatusMessage({ type: "error", text: error.message || "Unable to check connections." });
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    const app = searchParams.get("app");
    if (connected === "true") {
      const name = app === "excel" ? "Microsoft Excel" : app === "google_sheets" ? "Google Sheets" : "Your account";
      setStatusMessage({
        type: "success",
        text: `${name} connected successfully. You can now import your datasets for analysis.`,
        source: app === "excel" || app === "google_sheets" ? app : null,
      });
    } else if (connected === "false" || error) {
      setStatusMessage({
        type: "error",
        text: error === "session_expired"
          ? "Your session expired. Please sign in and try again."
          : "We couldn't connect that account. Please try again.",
      });
    }
    if (connected !== null || error !== null) {
      const clean = new URLSearchParams(searchParams);
      clean.delete("connected");
      clean.delete("error");
      clean.delete("app");
      setSearchParams(clean, { replace: true });
    }
    fetchConnectedApps();
    // Callback parameters are consumed once on mount; don't re-run on their cleanup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchConnectedApps]);

  // OAuth opens another page. Browsers may restore this component from the
  // back-forward cache when users cancel authorization and press Back.
  // Reset the pending button and re-check connection status on return.
  useEffect(() => {
    const restoreFromOAuth = () => {
      setActionId(null);
      fetchConnectedApps({ silent: true });
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setActionId(null);
      }
    };
    window.addEventListener("pageshow", restoreFromOAuth);
    window.addEventListener("focus", restoreFromOAuth);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pageshow", restoreFromOAuth);
      window.removeEventListener("focus", restoreFromOAuth);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchConnectedApps]);

  const isConnected = (id) => connectedApps.some((app) => app.id === id);

  const goToAnalytics = (source = null) => {
    navigate(ANALYTICS_ROUTE, {
      state: {
        source: "integrations",
        ...(source ? { preferredDataSource: source } : {}),
        // Analytics can use these hints to open its existing import picker.
        openImport: true,
      },
    });
  };

  const handleConnect = (id) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setStatusMessage({ type: "error", text: "Your session has expired. Please sign in again." });
      return;
    }
    setActionId(id);
    // Preserves your current backend OAuth contract.
    // IMPORTANT: A future backend change should replace the URL session token
    // with a short-lived, one-use authorization ticket.
    const params = new URLSearchParams({
      token,
      return_path: INTEGRATIONS_ROUTE,
    });
    window.location.assign(`${API_BASE_URL}/auth/${id}?${params.toString()}`);
  };

  const handleDisconnect = async () => {
    const id = disconnectTarget;
    if (!id) return;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setStatusMessage({ type: "error", text: "Your session has expired. Please sign in again." });
      setDisconnectTarget(null);
      return;
    }
    setActionId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/disconnect/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Couldn't disconnect this account. Please try again.");
      setConnectedApps((previous) => previous.filter((app) => app.id !== id));
      setStatusMessage({ type: "success", text: "Account disconnected successfully." });
      await fetchConnectedApps({ silent: true });
    } catch (error) {
      setStatusMessage({ type: "error", text: error.message || "Unable to disconnect." });
    } finally {
      setActionId(null);
      setDisconnectTarget(null);
    }
  };

  return (
    <main className="min-h-screen px-5 py-9 text-[#111827] sm:px-8 md:px-12 md:py-12"
      style={{
        fontFamily: "inherit",
        background: "radial-gradient(circle at 70% -10%, rgba(108,76,255,.055), transparent 28%), #dbdde3",
      }}>
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-9 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#6c4cff]">
              Metria / Data sources
            </div>
            <h1 className="mb-3 text-[clamp(28px,3vw,38px)] font-extrabold leading-tight tracking-[-.04em]">
              Where does your business data live?
            </h1>
            <p className="max-w-[680px] text-sm leading-7 text-[#667085] md:text-base">
              Connect an account or upload a spreadsheet. Then choose the data you'd like Metria to analyze.
            </p>
          </div>
          <button type="button" onClick={() => fetchConnectedApps({ silent: true })}
            disabled={refreshing || loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#e8eaf0] bg-white px-4 text-xs font-bold text-[#344054] disabled:opacity-50">
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh connections
          </button>
        </div>

        <div className="mb-7 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#667085]">
          <span className="rounded-full bg-white px-3 py-2 text-[#6c4cff] shadow-sm">1. Choose a source</span>
          <ArrowRight size={14} />
          <span>2. Select your dataset</span>
          <ArrowRight size={14} />
          <span>3. Get your first analysis</span>
        </div>

        {statusMessage && (
          <div role="status" className={`mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${
            statusMessage.type === "success"
              ? "border-[#bce8d2] bg-[#eaf8f1] text-[#138a5b]"
              : "border-[#ffd8dc] bg-[#fff0f1] text-[#a82e3a]"
          }`}>
            <div className="flex items-center gap-3 text-sm font-semibold">
              {statusMessage.type === "success" ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              <span>{statusMessage.text}</span>
            </div>
            {statusMessage.type === "success" && statusMessage.source !== undefined && (
              <button type="button" onClick={() => goToAnalytics(statusMessage.source || null)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#6c4cff] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#5138d8]">
                Go to Analytics page <ArrowRight size={15} />
              </button>
            )}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {SOURCES.map(({ id, title, description, Icon, accent }) => {
            const connected = isConnected(id);
            const busy = actionId === id;
            return (
              <article key={id} className="flex min-h-[315px] flex-col rounded-[24px] border border-[#e8eaf0] bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,.04)] md:p-7">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    accent === "blue" ? "bg-[#eef6ff] text-[#2774d8]" : "bg-[#f2efff] text-[#6c4cff]"
                  }`}><Icon size={23} /></div>
                  {connected && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf8f1] px-3 py-1.5 text-[11px] font-bold text-[#138a5b]">
                      <CheckCircle2 size={13} /> Connected
                    </span>
                  )}
                </div>
                <h2 className="mb-2 text-xl font-extrabold tracking-tight">{title}</h2>
                <p className="mb-7 text-sm leading-6 text-[#667085]">{description}</p>
                <div className="mt-auto">
                  {connected ? (
                    <>
                      <button type="button" onClick={() => goToAnalytics(id)}
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6c4cff] px-4 text-sm font-bold text-white hover:bg-[#5138d8]">
                        Choose a dataset <ArrowRight size={17} />
                      </button>
                      <button type="button" onClick={() => setDisconnectTarget(id)}
                        disabled={busy}
                        className="mt-3 flex w-full items-center justify-center gap-2 py-2 text-xs font-semibold text-[#667085] hover:text-[#c43d4b] disabled:opacity-50">
                        <Unplug size={14} /> Disconnect account
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => handleConnect(id)} disabled={busy || loading}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 text-sm font-bold text-white hover:bg-[#6c4cff] disabled:opacity-50">
                      {busy ? <RefreshCw size={16} className="animate-spin" /> : <Link2 size={16} />}
                      {busy ? "Connecting..." : `Connect ${title}`}
                    </button>
                  )}
                </div>
              </article>
            );
          })}

          <article className="flex min-h-[315px] flex-col rounded-[24px] border border-[#e8eaf0] bg-white p-6 shadow-[0_12px_30px_rgba(16,24,40,.04)] md:p-7">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf8f1] text-[#138a5b]">
              <Upload size={23} />
            </div>
            <h2 className="mb-2 text-xl font-extrabold tracking-tight">Upload a file</h2>
            <p className="mb-7 text-sm leading-6 text-[#667085]">
              Have a CSV or Excel file on your device? Import it directly without connecting an account.
            </p>
            <div className="mt-auto">
              <button type="button" onClick={() => goToAnalytics("file")}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6c4cff] px-4 text-sm font-bold text-white hover:bg-[#5138d8]">
                Upload a file <ArrowRight size={17} />
              </button>
              <p className="mt-3 text-center text-xs text-[#98a2b3]">No account connection required</p>
            </div>
          </article>
        </div>

        {connectedApps.length > 0 && (
          <section className="mb-6 rounded-[20px] border border-[#e8eaf0] bg-white px-5 py-4 md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-[#138a5b]" />
                <div>
                  <h3 className="text-sm font-bold">Your data source is ready</h3>
                  <p className="mt-1 text-xs text-[#667085]">Continue to Analytics to select a spreadsheet and begin.</p>
                </div>
              </div>
              <button type="button" onClick={() => goToAnalytics(connectedApps[0].id)}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#6c4cff]">
                Continue to Analytics <ArrowRight size={16} />
              </button>
            </div>
          </section>
        )}

        <div className="flex items-center gap-2 border-t border-[#cfd3dd] pt-6 text-xs text-[#667085]">
          <ShieldCheck size={17} className="text-[#6c4cff]" />
          You control which accounts are connected. You can disconnect them here at any time.
        </div>
      </div>

      {disconnectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/60 p-4"
          role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !actionId) setDisconnectTarget(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="disconnect-title"
            className="w-full max-w-md rounded-[22px] bg-white p-6 text-[#111827] shadow-2xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff0f1] text-[#c43d4b]">
              <Unplug size={21} />
            </div>
            <h2 id="disconnect-title" className="text-xl font-extrabold">Disconnect this account?</h2>
            <p className="mt-3 text-sm leading-6 text-[#667085]">
              Metria will no longer be able to import new data from {
                disconnectTarget === "excel" ? "Microsoft Excel" : "Google Sheets"
              } until you reconnect it.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" disabled={!!actionId} onClick={() => setDisconnectTarget(null)}
                className="rounded-xl border border-[#e8eaf0] px-5 py-3 text-sm font-bold disabled:opacity-50">
                Cancel
              </button>
              <button type="button" disabled={!!actionId} onClick={handleDisconnect}
                className="inline-flex items-center gap-2 rounded-xl bg-[#c43d4b] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                {actionId ? <RefreshCw size={16} className="animate-spin" /> : <XCircle size={16} />}
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
