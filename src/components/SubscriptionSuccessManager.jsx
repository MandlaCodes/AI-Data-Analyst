import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X, Sparkles } from "lucide-react";
import { useData } from "../contexts/DataContext";

const API_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mount once inside DataProvider (e.g. in AppWrapper). Never trust a Paddle
// client event alone: wait until the authenticated server reports is_pro.
export default function SubscriptionSuccessManager() {
  const { refreshAll } = useData();
  const [open, setOpen] = useState(false);
  const running = useRef(false);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    const onCheckout = async () => {
      if (running.current) return;
      const token = localStorage.getItem("adt_token");
      if (!token) return;
      running.current = true;
      try {
        for (let attempt = 0; attempt < 20 && active.current; attempt++) {
          try {
            const res = await fetch(`${API_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            });
            if (res.ok) {
              const account = await res.json();
              if (account?.is_pro === true) {
                await Promise.resolve(refreshAll()).catch(() => {});
                if (!active.current) return;
                window.dispatchEvent(new CustomEvent("metria_subscription_activated"));
                setOpen(true);
                return;
              }
            }
          } catch (error) {
            console.warn("Subscription verification pending", error);
          }
          await sleep(2000);
        }
      } finally {
        running.current = false;
      }
    };
    window.addEventListener("paddle_payment_success", onCheckout);
    return () => {
      active.current = false;
      window.removeEventListener("paddle_payment_success", onCheckout);
    };
  }, [refreshAll]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 px-5 backdrop-blur-xl" role="dialog" aria-modal="true" aria-labelledby="metria-pro-title">
      <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-purple-400/30 bg-[#10091b] px-8 py-12 text-center text-white shadow-[0_0_100px_rgba(151,47,255,0.25)]">
        <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute right-5 top-5 rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"><X size={20} /></button>
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-purple-400/30 bg-purple-500/15 text-purple-300"><CheckCircle2 size={43} /></div>
        <div className="mb-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.35em] text-purple-300"><Sparkles size={13} /> Membership activated</div>
        <h2 id="metria-pro-title" className="text-3xl font-black tracking-tight">Congratulations!</h2>
        <p className="mt-3 text-xl font-bold">MetriaAI Pro is now active.</p>
        <p className="mt-4 text-sm leading-6 text-zinc-400">Your payment has been verified. Unlimited Ask Metria questions are now available in Chat and Talk.</p>
        <button type="button" onClick={() => setOpen(false)} className="mt-9 w-full rounded-2xl bg-purple-600 px-6 py-4 text-sm font-bold transition-colors hover:bg-purple-500">Start exploring Pro</button>
      </div>
    </div>, document.body
  );
}
