import { useEffect, useState } from "react";

export default function Analytics() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/google/list-sheets")
      .then(res => res.json())
      .then(data => {
        console.log("Analytics sheets:", data);
        setSheets(data.sheets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
      <p className="text-gray-700">Select Google Sheet</p>

      {loading ? (
        <p>Loading sheets...</p>
      ) : sheets.length === 0 ? (
        <p className="text-red-500">
          No spreadsheets found. Check the Integrations page if you expected sheets.
        </p>
      ) : (
        <div className="space-y-3">
          {sheets.map(sheet => (
            <div
              key={sheet.id}
              className="p-4 border rounded-lg bg-white hover:bg-gray-50 cursor-pointer"
            >
              {sheet.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
