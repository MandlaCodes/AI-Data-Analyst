import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Integrations({ userId }) {
  const [sheets, setSheets] = useState([]);
  const BACKEND = "https://ai-data-analyst-backend-1nuw.onrender.com";

  // Fetch Google Sheets list
  const fetchSheets = async () => {
    try {
      const res = await axios.get(`${BACKEND}/sheets-list/${userId}`);
      setSheets(res.data.spreadsheets || []);
    } catch (err) {
      console.log("User not connected or error fetching sheets");
      setSheets([]);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Google Sheets</h2>
      {sheets.length === 0 ? (
        <p>Please connect Google Sheets first.</p>
      ) : (
        <ul className="space-y-2">
          {sheets.map((sheet) => (
            <li key={sheet.id} className="p-2 bg-gray-800 rounded-lg border border-gray-700">
              {sheet.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
