// src/components/DashboardManager.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useData } from "../contexts/DataContext"; 
import { FaSpinner } from "react-icons/fa";

// 💡 UPDATE: Use environment variables for the API URL, not a hardcoded string.
// This ensures you don't have to change the code when deploying to production.
const API_BASE_URL = import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:10000";

export default function DashboardManager({ profile }) {
  // We don't need to check profile?.token here; the parent App component should manage 
  // whether the user is logged in before rendering DashboardManager.
  const { setSavedSessions, setRefetchSessions } = useData();
  const [loading, setLoading] = useState(true);

  /**
   * Fetch analysis sessions for the LOGGED-IN user.
   * User identity is derived from JWT on the backend.
   */
  const fetchAnalysisSessions = async () => {
    // 💡 IMPROVEMENT: Use the token from the profile prop, assuming the main App component
    // passes the token along with the profile data, or relies only on localStorage.
    // Relying *only* on localStorage here is fine, but passing the token as a prop is cleaner.
    const token = localStorage.getItem("adt_token"); 
    
    if (!token) {
        setLoading(false);
        return;
    }

    setLoading(true);
    try {
      // ✅ Multi-tenancy check: Token is sent via Authorization header
      const res = await axios.get(`${API_BASE_URL}/analysis/sessions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (Array.isArray(res.data.sessions)) {
        setSavedSessions(res.data.sessions);
      } else {
        setSavedSessions([]);
      }
    } catch (err) {
      console.error("Error fetching analysis sessions:", err);
      // Log out user if token is invalid/expired (401)
      if (err.response && err.response.status === 401) {
          // You should implement an auto-logout mechanism in the parent App/Auth context
          // For now, console warning is enough.
          console.warn("Authentication failed. Session expired or token invalid.");
      }
      setSavedSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sessions on initial load (when the profile/token is present)
  useEffect(() => {
    // Check if the user is authenticated (using localStorage token check as the primary trigger)
    const token = localStorage.getItem("adt_token");
    if (token) {
      fetchAnalysisSessions();
    } else {
      setLoading(false); // If no token, finish loading immediately
    }
  }, [/* No dependencies needed here if relying on localStorage trigger */]);

  // Expose refetch function globally (used by Analytics after save)
  useEffect(() => {
    // The dependency array should include fetchAnalysisSessions if it changes, 
    // but since it's defined once, using an empty array or not including it is often cleaner.
    // We bind the refetch function once.
    setRefetchSessions(() => fetchAnalysisSessions);
  }, [setRefetchSessions]); // Dependency on setter itself

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <FaSpinner className="animate-spin mr-2" />
        Loading analysis sessions...
      </div>
    );
  }

  // Data-provider component — renders nothing visual
  return null;
}