import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiCheckCircle, FiLoader } from 'react-icons/fi';
import { motion } from 'framer-motion';

// This component is designed to run after a successful OAuth exchange.
// It assumes your backend redirects the user back to the frontend
// with the JWT token and user details as URL query parameters (e.g., ?token=...&user_id=...)

export default function AuthSuccessHandler() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Use URLSearchParams to easily parse query parameters
        const params = new URLSearchParams(location.search);
        
        // CRITICAL: Retrieve the token and user_id from the URL provided by the backend
        const token = params.get('token');
        const userId = params.get('user_id');

        if (token && userId) {
            console.log("🔐 Received token and user ID. Saving to Local Storage...");
            
            // 1. SAVE THE JWT TOKEN
            localStorage.setItem("adt_token", token);
            
            // 2. UPDATE AND SAVE THE USER PROFILE (CRITICAL for Analytics.jsx)
            let currentProfile = JSON.parse(localStorage.getItem('adt_profile') || '{}');
            
            const updatedProfile = {
                ...currentProfile,
                user_id: userId,
                // Set the flag that Analytics.jsx checks
                google_sheets_connected: true, 
                last_sheets_connection: new Date().toISOString()
            };
            
            localStorage.setItem("adt_profile", JSON.stringify(updatedProfile));
            
            // 3. Navigate the user to the Analytics page (or your desired main dashboard)
            setTimeout(() => {
                navigate('/analytics', { replace: true });
            }, 1000); // Small delay to show success message
            
        } else {
            console.error("❌ Auth Success Handler: Missing token or user ID in URL parameters.");
            // Navigate to an error page or back to the integrations page
            setTimeout(() => {
                navigate('/integrations', { replace: true });
            }, 3000);
        }
    }, [location, navigate]);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4"
        >
            <div className="text-center p-8 rounded-xl bg-gray-800 shadow-2xl border border-green-500/50">
                {
                    new URLSearchParams(location.search).get('token') ? (
                        <>
                            <FiCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold mb-2">Connection Successful!</h1>
                            <p className="text-gray-400">Securing your authentication token and profile...</p>
                            <FiLoader className="text-purple-400 animate-spin mx-auto mt-4" />
                        </>
                    ) : (
                        <>
                            <FiLoader className="text-purple-400 animate-spin text-6xl mx-auto mb-4" />
                            <h1 className="text-2xl font-bold mb-2">Processing Connection...</h1>
                            <p className="text-gray-400">Please wait while we finalize the link with Google Sheets.</p>
                        </>
                    )
                }
            </div>
        </motion.div>
    );
}

// NOTE: You must update your backend's Google Sheets OAuth redirect URI to point to the URL of this component.