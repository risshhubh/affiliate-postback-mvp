"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [affiliates, setAffiliates] = useState([]);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [conversions, setConversions] = useState([]);
  const [campaignClicks, setCampaignClicks] = useState([]);
  const [summary, setSummary] = useState(null);

  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const savedAffiliate = localStorage.getItem("selectedAffiliate");
    if (savedAffiliate) {
      setSelectedAffiliate(savedAffiliate);
    }
    fetch("http://localhost:5000/affiliates")
      .then((res) => res.json())
      .then((data) => {
        setAffiliates(data);
        if (!savedAffiliate && data.length > 0) setSelectedAffiliate(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedAffiliate) return;

    localStorage.setItem("selectedAffiliate", selectedAffiliate);

    fetch(`http://localhost:5000/conversions?affiliate_id=${selectedAffiliate}`)
      .then((res) => res.json())
      .then((data) => setConversions(data));

    fetch(`http://localhost:5000/campaign-clicks?affiliate_id=${selectedAffiliate}`)
      .then((res) => res.json())
      .then((data) => setCampaignClicks(data));

    fetch(`http://localhost:5000/dashboard-summary?affiliate_id=${selectedAffiliate}`)
      .then((res) => res.json())
      .then((data) => setSummary(data));
  }, [selectedAffiliate]);

  const sortedConversions = [...conversions].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];
    if (sortBy === "timestamp") {
      valA = new Date(valA);
      valB = new Date(valB);
    }
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  function handleSort(field) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans p-8 max-w-5xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-8 text-blue-800">Affiliate Dashboard</h1>

      {/* Affiliate selector */}
      <div className="mb-8">
        <label htmlFor="affiliate" className="block mb-2 font-semibold text-gray-700">
          Select Affiliate:
        </label>
        <select
          id="affiliate"
          className="border border-gray-300 rounded-md p-3 w-full max-w-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                     bg-white text-gray-900 shadow-sm"
          value={selectedAffiliate || ""}
          onChange={(e) => setSelectedAffiliate(e.target.value)}
        >
          {affiliates.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 text-center border border-gray-200">
            <p className="text-3xl font-bold text-blue-600">{summary.total_clicks}</p>
            <p className="text-gray-600 mt-1 uppercase tracking-wide">Clicks</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center border border-gray-200">
            <p className="text-3xl font-bold text-green-600">{summary.total_conversions}</p>
            <p className="text-gray-600 mt-1 uppercase tracking-wide">Conversions</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center border border-gray-200">
            <p className="text-3xl font-bold text-teal-600">${summary.total_revenue.toFixed(2)}</p>
            <p className="text-gray-600 mt-1 uppercase tracking-wide">Total Revenue</p>
          </div>
        </div>
      )}

      {/* Postback URL */}
      {selectedAffiliate && (
        <div className="mb-10 bg-white p-5 rounded-md shadow border border-gray-200">
          <h2 className="text-2xl font-semibold mb-3 text-blue-700">Your Unique Postback URL</h2>
          <code className="block p-4 bg-gray-100 rounded text-gray-800 font-mono break-words">
            {`https://affiliate-system.com/postback?affiliate_id=${selectedAffiliate}&click_id={click_id}&amount={amount}&currency={currency}`}
          </code>
        </div>
      )}

      {/* Campaign Clicks */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">Campaign Clicks</h2>
        <table className="w-full text-left border-collapse rounded-md overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-blue-100">
              <th className="p-4 font-semibold text-gray-700 border-b border-blue-200">Campaign Name</th>
              <th className="p-4 font-semibold text-gray-700 border-b border-blue-200 text-right">Clicks</th>
            </tr>
          </thead>
          <tbody>
            {campaignClicks.length > 0 ? (
              campaignClicks.map((c) => (
                <tr
                  key={c.campaign_id}
                  className="even:bg-white odd:bg-gray-50 hover:bg-blue-50 transition-colors"
                >
                  <td className="p-4 border-b border-blue-100">{c.campaign_name}</td>
                  <td className="p-4 border-b border-blue-100 text-right font-medium text-blue-800">
                    {c.click_count}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="p-6 text-center text-gray-400 italic">
                  No campaigns found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Conversions with sorting */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">Conversions</h2>
        <table className="w-full border-collapse rounded-md overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-blue-100 cursor-pointer select-none">
              <th
                onClick={() => handleSort("amount")}
                className="p-4 font-semibold text-gray-700 border-b border-blue-200"
              >
                Amount {sortBy === "amount" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
              </th>
              <th
                onClick={() => handleSort("currency")}
                className="p-4 font-semibold text-gray-700 border-b border-blue-200"
              >
                Currency {sortBy === "currency" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
              </th>
              <th
                onClick={() => handleSort("timestamp")}
                className="p-4 font-semibold text-gray-700 border-b border-blue-200"
              >
                Timestamp {sortBy === "timestamp" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedConversions.length > 0 ? (
              sortedConversions.map((conv) => (
                <tr
                  key={conv.id}
                  className="even:bg-white odd:bg-gray-50 hover:bg-blue-50 transition-colors"
                >
                  <td className="p-4 border-b border-blue-100 font-medium text-blue-900">
                    ${conv.amount.toFixed(2)}
                  </td>
                  <td className="p-4 border-b border-blue-100">{conv.currency}</td>
                  <td className="p-4 border-b border-blue-100">
                    {new Date(conv.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="p-6 text-center text-gray-400 italic">
                  No conversions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
