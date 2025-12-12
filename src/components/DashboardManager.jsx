// src/components/DashboardManager.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useData } from "../contexts/DataContext"; 
import { FaSpinner } from 'react-icons/fa'; // Assuming FaSpinner is imported

const API_BASE_URL = "https://ai-data-analyst-backend-1nuw.onrender.com"; 

export default function DashboardManager({ profile }) {
    // Use the context to share data and the setter function
    const { setSavedSessions, setRefetchSessions } = useData();

    const [loading, setLoading] = useState(true);
    
    // --- New Fetch Logic for Analysis Sessions ---
    const fetchAnalysisSessions = async () => {
        if (!profile?.user_id) return;
        setLoading(true);
        try {
            const token = localStorage.getItem("adt_token");
            // Assuming a new backend endpoint for fetching analysis sessions
            const res = await axios.get(`${API_BASE_URL}/analysis/sessions`, {
                params: { user_id: profile.user_id },
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data.sessions) {
                // Store fetched sessions in the global context state
                setSavedSessions(res.data.sessions);
            }
        } catch (err) {
            console.error("Error fetching analysis sessions:", err);
            setSavedSessions([]);
        } finally {
            setLoading(false);
        }
    };
    
    // 1. Fetch on mount
    useEffect(() => {
        fetchAnalysisSessions();
    }, [profile?.user_id]); 

    // 2. Expose the refetch function to be used by other components (like Analytics)
    useEffect(() => {
        setRefetchSessions(() => fetchAnalysisSessions);
    }, [profile?.user_id]);


    if (loading) return (
        // Render a basic loading state for clarity, though this component should eventually be hidden
        <div className="flex items-center justify-center h-full text-gray-400">
            <FaSpinner className="animate-spin mr-2" /> Loading analysis sessions...
        </div>
    );
    
    // This component acts as a data provider and renders nothing visible
    return null; 
}