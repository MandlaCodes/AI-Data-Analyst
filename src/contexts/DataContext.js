// src/contexts/DataContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const DataContext = createContext(null);
const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [savedSessions, setSavedSessions] = useState([]);
    const [profile, setProfile] = useState(() => {
        const saved = localStorage.getItem("adt_profile");
        return saved ? JSON.parse(saved) : null;
    });

    // We use useCallback so this function is "stable" and can be used in useEffects
    const refreshAll = useCallback(async () => {
        const token = localStorage.getItem("adt_token");
        if (!token) return;

        try {
            // 1. Sync Profile
            const profileRes = await axios.get(`${API_BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(profileRes.data);
            localStorage.setItem("adt_profile", JSON.stringify(profileRes.data));

            // 2. Sync Sessions (Example endpoint - adjust to your actual sessions route)
            const sessionsRes = await axios.get(`${API_BASE_URL}/analysis/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSavedSessions(sessionsRes.data);
            
            console.log("Global Intel Sync Complete.");
        } catch (err) {
            console.error("Global sync failed:", err);
            // If 401 Unauthorized, maybe trigger logout here
        }
    }, []);

    // AUTO-SYNC ON BOOT: 
    // This ensures the profile and sessions are fresh every time the app loads
    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    return (
        <DataContext.Provider value={{ 
            savedSessions, 
            setSavedSessions, 
            profile, 
            setProfile, 
            refreshAll 
        }}>
            {children}
        </DataContext.Provider>
    );
};