import React, { useEffect, useState } from "react";

import {

  UserRound, Mail, Building2, BriefcaseBusiness, CreditCard,

  Check, Pencil, Loader2, ArrowUpRight, ShieldCheck, CalendarDays,

  AlertCircle, X, Sparkles

} from "lucide-react";

import { motion } from "framer-motion";

import { useData } from "../contexts/DataContext";



const API_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";



const displayValue = (value) => (typeof value === "string" && value.trim() ? value : "Not provided");



function DetailField({ icon: Icon, label, value, field, onSave }) {

  const [editing, setEditing] = useState(false);

  const [draft, setDraft] = useState(value || "");

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");



  useEffect(() => {

    if (!editing) setDraft(value || "");

  }, [value, editing]);



  const save = async () => {

    if (!field || saving) return;

    if (draft.trim() === (value || "").trim()) {

      setEditing(false);

      return;

    }

    setSaving(true);

    setError("");

    try {

      await onSave(field, draft.trim());

      setEditing(false);

    } catch (err) {

      setError(err.message || "Couldn't save this change.");

    } finally {

      setSaving(false);

    }

  };



  return (

    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6 min-w-0">

      <div className="flex items-center justify-between gap-3 mb-4">

        <div className="flex items-center gap-2.5 text-zinc-400">

          <Icon size={16} className="text-purple-400" />

          <span className="text-[10px] font-bold uppercase tracking-[0.19em]">{label}</span>

        </div>

        {field && !editing && (

          <button type="button" onClick={() => { setError(""); setEditing(true); }}

            aria-label={`Edit ${label}`} className="rounded-lg p-2 text-zinc-400 hover:text-purple-300 hover:bg-white/5 transition-colors">

            <Pencil size={15} />

          </button>

        )}

      </div>

      {editing ? (

        <div className="flex gap-2 items-center">

          <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}

            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); save(); } if (e.key === "Escape") setEditing(false); }}

            aria-label={label}

            className="min-w-0 flex-1 bg-black/60 border border-purple-500/60 rounded-xl px-3 py-2 text-white outline-none focus:ring-2 focus:ring-purple-500/30" />

          <button type="button" onClick={save} disabled={saving} aria-label={`Save ${label}`}

            className="p-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl disabled:opacity-50">

            {saving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}

          </button>

          <button type="button" onClick={() => setEditing(false)} disabled={saving} aria-label="Cancel editing"

            className="p-2.5 bg-white/10 hover:bg-white/15 rounded-xl disabled:opacity-50"><X size={17} /></button>

        </div>

      ) : (

        <p className="text-white font-semibold text-base sm:text-lg break-words">{displayValue(value)}</p>

      )}

      {error && <p role="alert" className="text-rose-400 text-xs mt-2">{error}</p>}

    </div>

  );

}



export default function Profile() {

  const { profile, refreshAll } = useData();

  const [checkingOut, setCheckingOut] = useState(false);

  const [billingError, setBillingError] = useState("");

  const [paymentPending, setPaymentPending] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);



  // A checkout completion is not proof that a webhook has granted access.

  // Refresh backend account state instead of immediately displaying Pro.

  useEffect(() => {

    const onPayment = () => {

      setPaymentPending(true);

      Promise.resolve(refreshAll()).catch(() => {});

    };

    const onActivated = () => { setPaymentPending(false); Promise.resolve(refreshAll()).catch(() => {}); };

    window.addEventListener("paddle_payment_success", onPayment);

    window.addEventListener("metria_subscription_activated", onActivated);

    return () => {

      window.removeEventListener("paddle_payment_success", onPayment);

      window.removeEventListener("metria_subscription_activated", onActivated);

    };

  }, [refreshAll]);



  useEffect(() => {

    if (profile?.is_pro && paymentPending) setPaymentPending(false);

  }, [profile?.is_pro, paymentPending]);



  const handleUpdateProfile = async (field, value) => {

    const token = localStorage.getItem("adt_token");

    if (!token) throw new Error("Please sign in again to update your account.");

    const response = await fetch(`${API_URL}/auth/profile/update`, {

      method: "PUT",

      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },

      body: JSON.stringify({

        first_name: profile?.first_name || "",

        last_name: profile?.last_name || "",

        organization: profile?.organization || "",

        industry: profile?.industry || "",

        [field]: value

      })

    });

    if (!response.ok) {

      const body = await response.json().catch(() => ({}));

      throw new Error(typeof body.detail === "string" ? body.detail : "Couldn't update your profile.");

    }

    await refreshAll();

  };



  const openCheckout = async () => {

    if (checkingOut) return;

    setBillingError("");

    setCheckingOut(true);

    try {

      const token = localStorage.getItem("adt_token");

      if (!token) throw new Error("Please sign in to upgrade.");

      const response = await fetch(`${API_URL}/api/billing/checkout`, {

        method: "POST",

        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {

        throw new Error(typeof data.detail === "string" ? data.detail : "Unable to start checkout.");

      }

      if (!data.transaction_id) throw new Error("Paddle did not return a checkout transaction.");

      if (!window.Paddle?.Checkout?.open) throw new Error("Payment checkout is still loading. Please try again.");

      window.Paddle.Checkout.open({ transactionId: data.transaction_id });

    } catch (err) {

      setBillingError(err.message || "Unable to start checkout.");

    } finally {

      setCheckingOut(false);

    }

  };



  const openBillingPortal = async () => {
    if (openingPortal) return;
    setBillingError("");
    setOpeningPortal(true);
    try {
      const token = localStorage.getItem("adt_token");
      if (!token) throw new Error("Please sign in again.");
      const response = await fetch(`${API_URL}/api/billing/portal`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Unable to open billing portal.");
      if (typeof data.url !== "string" || !data.url.startsWith("https://")) throw new Error("Invalid billing portal link.");
      window.location.assign(data.url);
    } catch (err) {
      setBillingError(err.message || "Unable to open billing portal.");
      setOpeningPortal(false);
    }
  };

  if (!profile) return (

    <div className="min-h-[60vh] flex items-center justify-center bg-black text-purple-400">

      <Loader2 className="animate-spin" size={30} aria-label="Loading profile" />

    </div>

  );



  const isPro = Boolean(profile.is_pro);

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Your account";

  const billingDate = profile.next_billing_date || profile.next_payment_date || null;

  

  



  return (

    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden relative">

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute -top-48 left-1/4 h-96 w-96 rounded-full bg-purple-700/10 blur-[120px]" />

      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-10 sm:py-14 space-y-8">

        <header className="space-y-2">

          <p className="text-purple-400 uppercase text-[10px] font-bold tracking-[0.32em]">Account settings</p>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">My Profile</h1>

          <p className="text-sm text-zinc-400">Manage your account details and subscription.</p>

        </header>



        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}

          className="flex items-center gap-5 sm:gap-6 rounded-[28px] border border-white/10 bg-gradient-to-r from-[#14101d] to-[#08070b] p-6 sm:p-8">

          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-purple-500/40 bg-purple-500/10 flex items-center justify-center">

            <UserRound size={34} className="text-purple-300" />

          </div>

          <div className="min-w-0">

            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight break-words">{fullName}</h2>

            <p className="text-zinc-400 text-sm mt-1 break-all">{profile.email || ""}</p>

            <div className="flex flex-wrap items-center gap-2 mt-3">

              <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[10px] font-bold text-purple-300 uppercase tracking-widest">

                <ShieldCheck size={12} /> {isPro ? "Pro member" : "Free account"}

              </span>

              {profile.organization && <span className="text-zinc-500 text-xs">{profile.organization}</span>}

            </div>

          </div>

        </motion.section>



        <section className="rounded-[28px] border border-purple-500/25 bg-gradient-to-br from-[#170e23] via-[#100c17] to-[#08070b] p-6 sm:p-8 lg:p-10 relative overflow-hidden">

          <Sparkles className="absolute -right-6 -top-6 text-purple-500/10" size={180} aria-hidden="true" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-7">

            <div className="max-w-xl space-y-3">

              <div className="flex items-center gap-3 flex-wrap">

                <span className="text-purple-300 text-[10px] font-extrabold uppercase tracking-[0.25em]">MetriaAI subscription</span>

                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${isPro ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-zinc-300"}`}>

                  {isPro ? "Pro · Active" : "Free plan"}

                </span>

              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{isPro ? "Your Pro plan is active" : "Unlock MetriaAI Pro"}</h2>

              <p className="text-zinc-400 text-sm leading-relaxed">

                {isPro ? "Continue exploring your business data with unlimited Ask Metria questions." : "Get unlimited Ask Metria questions across Chat and Talk, and keep exploring your business data."}

              </p>

              {isPro && billingDate && (

                <p className="flex items-center gap-2 text-xs text-zinc-300"><CalendarDays size={14} /> Next billing: {new Date(billingDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>

              )}

              {!isPro && <p className="text-2xl font-bold">$89 <span className="text-sm font-medium text-zinc-400">/ month</span></p>}

            </div>

            <div className="w-full lg:w-auto flex flex-col gap-3 lg:min-w-[215px]">

              {!isPro ? (

                <button type="button" onClick={openCheckout} disabled={checkingOut}

                  className="inline-flex justify-center items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-6 py-4 text-sm font-bold transition-colors disabled:opacity-60 shadow-[0_10px_30px_rgba(147,51,234,0.2)]">

                  {checkingOut ? <Loader2 size={18} className="animate-spin" /> : <ArrowUpRight size={18} />}

                  {checkingOut ? "Opening checkout..." : "Upgrade to Pro"}

                </button>

              ) : (
              <button type="button" onClick={openBillingPortal} disabled={openingPortal}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/15 hover:bg-purple-500/25 px-6 py-4 text-sm font-bold transition-colors disabled:opacity-60">
                {openingPortal ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                {openingPortal ? "Opening billing portal..." : "Manage subscription"}
                {!openingPortal && <ArrowUpRight size={16} />}
              </button>
            )}
            {isPro && <p className="text-center text-[11px] text-zinc-400">Manage payments or cancel your subscription securely with Paddle.</p>}{!isPro && <p className="text-center text-[11px] text-zinc-500">Secure checkout powered by Paddle</p>}

            </div>

          </div>

          {billingError && <p role="alert" className="relative z-10 flex items-center gap-2 text-rose-300 text-sm mt-5"><AlertCircle size={16} />{billingError}</p>}

          {paymentPending && !isPro && (

            <div className="relative z-10 mt-5 rounded-xl border border-purple-500/20 bg-purple-500/10 p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">

              <p className="text-sm text-purple-200">Payment received. Waiting for your subscription to be confirmed.</p>

              <span className="text-xs text-purple-300">Updating automatically…</span>

            </div>

          )}

        </section>



        <section className="space-y-4">

          <div>

            <h2 className="text-xl font-bold">Account details</h2>

            <p className="text-sm text-zinc-500 mt-1">Keep your business information up to date.</p>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <DetailField icon={Mail} label="Email address" value={profile.email} />

            <DetailField icon={UserRound} label="Full name" value={fullName} />

            <DetailField icon={Building2} label="Organization" value={profile.organization} field="organization" onSave={handleUpdateProfile} />

            <DetailField icon={BriefcaseBusiness} label="Industry" value={profile.industry} field="industry" onSave={handleUpdateProfile} />

          </div>

        </section>

        <p className="text-center text-[10px] uppercase tracking-[0.25em] text-zinc-600 pt-3">MetriaAI · Account settings</p>

      </div>

    </div>

  );

}
