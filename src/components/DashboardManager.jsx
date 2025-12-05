// src/components/DashboardManager.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function DashboardManager({ profile }) {
  const [dashboards, setDashboards] = useState([]);
  const [currentDashboard, setCurrentDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardName, setDashboardName] = useState("");

  // Fetch user's saved dashboards on mount
  useEffect(() => {
    if (!profile?.user_id) return;

    async function fetchDashboards() {
      try {
        const res = await axios.get(`/api/dashboard/sessions`, {
          params: { user_id: profile.user_id },
        });
        if (res.data.sessions) {
          setDashboards(res.data.sessions);
          // Automatically load the 'current' dashboard if exists
          const current = res.data.sessions.find((d) => d.is_current);
          if (current) setCurrentDashboard(current);
        }
      } catch (err) {
        console.error("Error fetching dashboards:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboards();
  }, [profile]);

  // Save or update current dashboard
  const saveDashboard = async () => {
    if (!profile?.user_id || !currentDashboard) return;

    try {
      const payload = {
        user_id: profile.user_id,
        dashboard_id: currentDashboard.id, // null if new
        name: currentDashboard.name || dashboardName || "Untitled Dashboard",
        layout_data: JSON.stringify(currentDashboard.layout || {}),
      };

      const res = await axios.post("/api/dashboard/save", payload);
      if (res.data.success) {
        alert("Dashboard saved!");
        // Refresh dashboard list
        setDashboards((prev) => {
          const filtered = prev.filter((d) => d.id !== payload.dashboard_id);
          return [res.data.dashboard, ...filtered];
        });
      }
    } catch (err) {
      console.error("Error saving dashboard:", err);
    }
  };

  // Create a new dashboard
  const createNewDashboard = () => {
    const newDash = {
      id: null,
      name: "New Dashboard",
      layout: { widgets: [] },
      last_accessed: new Date().toISOString(),
      is_current: true,
    };
    setCurrentDashboard(newDash);
  };

  // Load a selected dashboard
  const loadDashboard = (dashboard) => {
    setCurrentDashboard(dashboard);
  };

  if (loading) return <div>Loading dashboards...</div>;

  return (
    <div className="dashboard-manager">
      <div className="dashboard-sidebar">
        <h3>Your Dashboards</h3>
        <button onClick={createNewDashboard}>+ New Dashboard</button>
        <ul>
          {dashboards.map((dash) => (
            <li
              key={dash.id || dash.name}
              onClick={() => loadDashboard(dash)}
              style={{
                fontWeight: dash.id === currentDashboard?.id ? "bold" : "normal",
              }}
            >
              {dash.name} {dash.is_current && "(Current)"}
            </li>
          ))}
        </ul>
      </div>

      <div className="dashboard-main">
        {currentDashboard ? (
          <>
            <input
              type="text"
              value={currentDashboard.name}
              onChange={(e) =>
                setCurrentDashboard({ ...currentDashboard, name: e.target.value })
              }
              placeholder="Dashboard Name"
            />
            {/* Replace below with your actual dashboard editor/rendering logic */}
            <div className="dashboard-editor">
              <pre>{JSON.stringify(currentDashboard.layout, null, 2)}</pre>
            </div>
            <button onClick={saveDashboard}>Save Dashboard</button>
          </>
        ) : (
          <div>No dashboard loaded. Select or create one!</div>
        )}
      </div>
    </div>
  );
}
