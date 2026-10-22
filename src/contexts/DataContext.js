// src/contexts/DataContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const DataContext = createContext(null);
const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [savedSessions, setSavedSessions] = useState([]);
    const [profile, setProfile] = useState(() => {
        try {
            const saved = localStorage.getItem("adt_profile");
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });
    const [billingStatus, setBillingStatus] = useState(null);
    const [billingStatusError, setBillingStatusError] = useState("");
    const refreshBillingStatus = useCallback(async () => {
        const token = localStorage.getItem("adt_token");
        if (!token) { setBillingStatus(null); return; }
        try {
            const response = await axios.get(`${API_BASE_URL}/api/billing/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBillingStatus(response.data);
            setBillingStatusError("");
        } catch (error) {
            // Keep the previous state rather than displaying an unverified cancellation status.
            setBillingStatusError("Subscription details couldn't be refreshed. Please try again.");
            console.error("Billing status sync failed:", error);
        }
    }, []);

    const refreshAll = useCallback(async () => {
        const token = localStorage.getItem("adt_token");
        if (!token) { setBillingStatus(null); return; }
        const headers = { Authorization: `Bearer ${token}` };
        // Independent requests: a billing outage must not prevent profile/session sync.
        await Promise.allSettled([
            axios.get(`${API_BASE_URL}/auth/me`, { headers }).then(({ data }) => {
                setProfile(data);
                localStorage.setItem("adt_profile", JSON.stringify(data));
            }),
            axios.get(`${API_BASE_URL}/analysis/trends`, { headers }).then(({ data }) => setSavedSessions(data)),
            refreshBillingStatus()
        ]);
    }, [refreshBillingStatus]);

    useEffect(() => { refreshAll(); }, [refreshAll]);

    useEffect(() => {
        const onReturn = () => {
            if (document.visibilityState === "visible") refreshAll();
        };
        const onFocus = () => refreshAll();
        document.addEventListener("visibilitychange", onReturn);
        window.addEventListener("focus", onFocus);
        return () => {
            document.removeEventListener("visibilitychange", onReturn);
            window.removeEventListener("focus", onFocus);
        };
    }, [refreshAll]);

    return (
        <DataContext.Provider value={{
            savedSessions, setSavedSessions, profile, setProfile, refreshAll,
            billingStatus, billingStatusError, refreshBillingStatus
        }}>
            {children}
        </DataContext.Provider>
    );
};