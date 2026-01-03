// src/contexts/DataContext.js
import React, { createContext, useState, useContext } from 'react';

// Create the Context
const DataContext = createContext(null);

// Custom Hook for ease of use
export const useData = () => useContext(DataContext);

// Provider Component
export const DataProvider = ({ children }) => {
    // This state will hold the list of all analysis sessions saved by the user
    const [savedSessions, setSavedSessions] = useState([]);
    
    // Function to refetch data from the backend (will be defined in DashboardManager)
    const [refetchSessions, setRefetchSessions] = useState(() => () => console.log("Refetch function not yet initialized."));
    
    return (
        <DataContext.Provider value={{ 
            savedSessions, 
            setSavedSessions, 
            refetchSessions 
        }}>
            {children}
        </DataContext.Provider>
    );
};