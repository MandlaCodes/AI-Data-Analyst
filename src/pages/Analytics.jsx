import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

export default function Analytics() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND = "https://ai-data-analyst-backend-1nuw.onrender.com";

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const userId = searchParams.get("user_id") || "123";

  const fetchSheets = async () => {
    try {
      const res = await axios.get(`${BACKEND}/sheets-list/${userId}`);
      setSheets(res.data.sheets || []);
    } catch (err) {
      console.log(err);
      setSheets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, []);

  return (
    <div className="space-y-10">
      <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500">
        Analytics Dashboard
      </h2>

      <p className="text-gray-300 text-lg">
        Create strategic business insights that enable confident, data-driven decisions.
      </p>

      <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-4">Select Google Sheet</h3>

        {loading ? (
          <p className="text-gray-300">Loading...</p>
        ) : sheets.length === 0 ? (
          <p className="text-red-400">No spreadsheets found.</p>
        ) : (
          <ul className="space-y-2">
            {sheets.map((sheet) => (
              <li key={sheet.id} className="text-white bg-gray-700 p-3 rounded-xl">
                {sheet.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
