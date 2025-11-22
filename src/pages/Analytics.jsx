import React, { useState, useEffect } from "react";

export default function Analytics() {
  const BACKEND = "https://ai-data-analyst-backend-1nuw.onrender.com";

  const [connected, setConnected] = useState(false);
  const [sheets, setSheets] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(true);

  // Check Google status + load sheets only here
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${BACKEND}/google/status?user_id=123`);
        const data = await res.json();

        setConnected(data.connected);

        if (data.connected) {
          const sheetsRes = await fetch(
            `${BACKEND}/google/list-sheets?user_id=123`
          );
          const sheetsData = await sheetsRes.json();
          setSheets(sheetsData.sheets || []);
        }
      } catch (err) {
        console.error("Error loading sheets:", err);
      }
      setLoadingSheets(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Create strategic business insights that enable confident, data-driven
        decisions.
      </p>

      {!connected ? (
        <div className="p-6 border rounded-lg bg-white dark:bg-neutral-900">
          <p className="text-red-500 font-medium">
            Google Sheets is not connected.
          </p>
          <p className="text-neutral-500">
            Go to the Integrations page to connect it.
          </p>
        </div>
      ) : loadingSheets ? (
        <p>Loading sheets...</p>
      ) : (
        <div className="p-6 border rounded-lg bg-white dark:bg-neutral-900">
          <h2 className="text-xl font-semibold mb-4">Select Google Sheet</h2>

          {sheets.length === 0 ? (
            <p className="text-neutral-500">
              No spreadsheets found. Check the Integrations page if you expected
              sheets.
            </p>
          ) : (
            <ul className="space-y-2">
              {sheets.map((sheet) => (
                <li
                  key={sheet.id}
                  className="p-3 border rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  {sheet.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
