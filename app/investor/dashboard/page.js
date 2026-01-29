"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function InvestorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [startups, setStartups] = useState([]);
  const [myConnections, setMyConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    industry: "all",
    stage: "all",
    search: "",
  });

  useEffect(() => {
    fetchUserData();
    fetchStartups();
    fetchMyConnections();
  }, []);

  useEffect(() => {
    fetchStartups();
  }, [filters]);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/investor/login");
        return;
      }
      const data = await res.json();
      setUser(data);
    } catch (error) {
      router.push("/investor/login");
    }
  };

  const fetchStartups = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.industry !== "all") params.set("industry", filters.industry);
      if (filters.stage !== "all") params.set("stage", filters.stage);
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(`/api/startups?${params}`);
      const data = await res.json();
      setStartups(data);
    } catch (error) {
      console.error("Error fetching startups:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyConnections = async () => {
    try {
      const res = await fetch("/api/connections");
      const data = await res.json();
      setMyConnections(data);
    } catch (error) {
      console.error("Error fetching connections:", error);
    }
  };

  const expressInterest = async (startupId) => {
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startupId }),
      });

      if (res.ok) {
        fetchMyConnections();
        alert("Interest expressed successfully!");
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      alert("Error expressing interest");
    }
  };

  const isConnected = (startupId) => {
    return myConnections.some((c) => c.startupId?._id === startupId || c.startupId === startupId);
  };

  const getConnectionStatus = (startupId) => {
    const conn = myConnections.find((c) => c.startupId?._id === startupId || c.startupId === startupId);
    return conn?.status;
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">Investmate</Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user?.profile?.fullName}</span>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Find Startups</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search startups..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filters.industry}
              onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
              className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Industries</option>
              <option value="EdTech">EdTech</option>
              <option value="FinTech">FinTech</option>
              <option value="HealthTech">HealthTech</option>
              <option value="AgriTech">AgriTech</option>
              <option value="Logistics">Logistics</option>
              <option value="AI/ML">AI/ML</option>
              <option value="SaaS">SaaS</option>
              <option value="Others">Others</option>
            </select>
            <select
              value={filters.stage}
              onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
              className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Stages</option>
              <option value="Idea">Idea</option>
              <option value="MVP">MVP</option>
              <option value="Launched">Launched</option>
              <option value="Early Revenue">Early Revenue</option>
              <option value="Scaling">Scaling</option>
            </select>
            <button
              onClick={() => setFilters({ industry: "all", stage: "all", search: "" })}
              className="p-3 border rounded hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Startups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {startups.length === 0 ? (
            <p className="text-gray-500 col-span-full text-center py-8">No startups found</p>
          ) : (
            startups.map((startup) => (
              <div key={startup._id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-800">{startup.startupName}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {startup.stage}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{startup.tagline}</p>
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <p><strong>Industry:</strong> {startup.industry || "N/A"}</p>
                  <p><strong>Founder:</strong> {startup.founderName}</p>
                  <p><strong>Location:</strong> {startup.location || "N/A"}</p>
                  <p><strong>Funding:</strong> {startup.funding || "N/A"}</p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2"><strong>Problem:</strong></p>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{startup.problem}</p>
                </div>
                
                {isConnected(startup._id) ? (
                  <div className={`text-center py-2 rounded ${
                    getConnectionStatus(startup._id) === "accepted" 
                      ? "bg-green-100 text-green-800" 
                      : getConnectionStatus(startup._id) === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {getConnectionStatus(startup._id) === "accepted" && "✓ Connected"}
                    {getConnectionStatus(startup._id) === "rejected" && "✗ Declined"}
                    {getConnectionStatus(startup._id) === "pending" && "⏳ Pending"}
                  </div>
                ) : (
                  <button
                    onClick={() => expressInterest(startup._id)}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Express Interest
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* My Connections Summary */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">My Connections ({myConnections.length})</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-yellow-50 rounded">
              <p className="text-2xl font-bold text-yellow-600">
                {myConnections.filter((c) => c.status === "pending").length}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <p className="text-2xl font-bold text-green-600">
                {myConnections.filter((c) => c.status === "accepted").length}
              </p>
              <p className="text-sm text-gray-600">Accepted</p>
            </div>
            <div className="p-4 bg-red-50 rounded">
              <p className="text-2xl font-bold text-red-600">
                {myConnections.filter((c) => c.status === "rejected").length}
              </p>
              <p className="text-sm text-gray-600">Declined</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
