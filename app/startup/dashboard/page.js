"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StartupDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchUserData();
    fetchConnections();
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        startupName: profile.startupName || "",
        tagline: profile.tagline || "",
        founderName: profile.founderName || "",
        phone: profile.phone || "",
        location: profile.location || "",
        website: profile.website || "",
        stage: profile.stage || "Idea",
        industry: profile.industry || "",
        teamSize: profile.teamSize || "",
        problem: profile.problem || "",
        solution: profile.solution || "",
        valueProp: profile.valueProp || "",
        market: profile.market || "",
        revenueModel: profile.revenueModel || "",
        traction: profile.traction || "",
        techStack: profile.techStack || "",
        funding: profile.funding || "",
        fundUsage: profile.fundUsage || "",
        prevFunding: profile.prevFunding || "No",
        linkedinUrl: profile.socialLinks?.linkedin || "",
        twitterUrl: profile.socialLinks?.twitter || "",
        otherUrl: profile.socialLinks?.other || "",
      });
    }
  }, [profile]);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/startup/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setProfile(data.profile);
    } catch (error) {
      router.push("/startup/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const res = await fetch("/api/connections");
      const data = await res.json();
      setConnections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching connections:", error);
    }
  };

  const updateConnectionStatus = async (connectionId, status) => {
    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchConnections();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      alert("Error updating connection");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Prepare data with social links as nested object
      const { linkedinUrl, twitterUrl, otherUrl, ...rest } = formData;
      const dataToSave = {
        ...rest,
        socialLinks: {
          linkedin: linkedinUrl,
          twitter: twitterUrl,
          other: otherUrl,
        },
      };

      const res = await fetch("/api/startup/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setEditMode(false);
        alert("Profile updated successfully!");
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      alert("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  // Check if profile is incomplete
  const isProfileIncomplete = !profile?.location || !profile?.phone || !profile?.industry;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const pendingConnections = connections.filter((c) => c.status === "pending");
  const acceptedConnections = connections.filter((c) => c.status === "accepted");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">Investmate</Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {profile?.founderName}</span>
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
        {/* Profile Incomplete Warning */}
        {isProfileIncomplete && !editMode && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg mb-6">
            <p className="font-semibold text-orange-800">
              ⚠️ Complete your profile to attract more investors!
            </p>
            <button
              onClick={() => setEditMode(true)}
              className="mt-2 text-orange-600 hover:text-orange-800 underline text-sm"
            >
              Complete Profile Now →
            </button>
          </div>
        )}

        {/* Edit Profile Form */}
        {editMode && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Complete Your Profile</h2>
              <button
                onClick={() => setEditMode(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Basic Info */}
              <div className="lg:col-span-3">
                <h3 className="font-medium text-gray-700 mb-3 border-b pb-2">Basic Information</h3>
              </div>
              
              <input
                name="startupName"
                value={formData.startupName}
                onChange={handleInputChange}
                placeholder="Startup Name *"
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="tagline"
                value={formData.tagline}
                onChange={handleInputChange}
                placeholder="Tagline *"
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="founderName"
                value={formData.founderName}
                onChange={handleInputChange}
                placeholder="Founder Name *"
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Contact Info */}
              <div className="lg:col-span-3 mt-4">
                <h3 className="font-medium text-gray-700 mb-3 border-b pb-2">Contact Information</h3>
              </div>
              
              <input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone Number"
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Location (City, Country)"
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="Website URL"
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Business Info */}
              <div className="lg:col-span-3 mt-4">
                <h3 className="font-medium text-gray-700 mb-3 border-b pb-2">Business Details</h3>
              </div>
              
              <select
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Industry</option>
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
                name="stage"
                value={formData.stage}
                onChange={handleInputChange}
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Idea">Idea</option>
                <option value="MVP">MVP</option>
                <option value="Launched">Launched</option>
                <option value="Early Revenue">Early Revenue</option>
                <option value="Scaling">Scaling</option>
              </select>
              
              <input
                name="teamSize"
                type="number"
                value={formData.teamSize}
                onChange={handleInputChange}
                placeholder="Team Size"
                min="1"
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                name="techStack"
                value={formData.techStack}
                onChange={handleInputChange}
                placeholder="Tech Stack (e.g., React, Node.js)"
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Problem & Solution */}
              <div className="lg:col-span-3 mt-4">
                <h3 className="font-medium text-gray-700 mb-3 border-b pb-2">Problem & Solution</h3>
              </div>
              
              <textarea
                name="problem"
                value={formData.problem}
                onChange={handleInputChange}
                placeholder="Problem you're solving *"
                rows={3}
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 lg:col-span-3"
              />
              <textarea
                name="solution"
                value={formData.solution}
                onChange={handleInputChange}
                placeholder="Your solution *"
                rows={3}
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 lg:col-span-3"
              />
              <textarea
                name="valueProp"
                value={formData.valueProp}
                onChange={handleInputChange}
                placeholder="Unique Value Proposition"
                rows={2}
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 lg:col-span-3"
              />

              {/* Market & Revenue */}
              <div className="lg:col-span-3 mt-4">
                <h3 className="font-medium text-gray-700 mb-3 border-b pb-2">Market & Traction</h3>
              </div>
              
              <textarea
                name="market"
                value={formData.market}
                onChange={handleInputChange}
                placeholder="Target Market"
                rows={2}
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                name="revenueModel"
                value={formData.revenueModel}
                onChange={handleInputChange}
                placeholder="Revenue Model"
                rows={2}
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                name="traction"
                value={formData.traction}
                onChange={handleInputChange}
                placeholder="Traction (users, revenue, etc.)"
                rows={2}
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Funding */}
              <div className="lg:col-span-3 mt-4">
                <h3 className="font-medium text-gray-700 mb-3 border-b pb-2">Funding Information</h3>
              </div>
              
              <input
                name="funding"
                value={formData.funding}
                onChange={handleInputChange}
                placeholder="Funding Required (e.g., ₹50L)"
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                name="prevFunding"
                value={formData.prevFunding}
                onChange={handleInputChange}
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="No">No Previous Funding</option>
                <option value="Yes">Previously Funded</option>
              </select>
              <textarea
                name="fundUsage"
                value={formData.fundUsage}
                onChange={handleInputChange}
                placeholder="How will you use the funds?"
                rows={2}
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 lg:col-span-3"
              />

              {/* Social Media Links */}
              <div className="lg:col-span-3 mt-4">
                <h3 className="font-medium text-gray-700 mb-3 border-b pb-2">🔗 Social Media Links</h3>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-blue-600">🔗</span>
                <input
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleInputChange}
                  placeholder="LinkedIn URL"
                  className="flex-1 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">🐦</span>
                <input
                  name="twitterUrl"
                  value={formData.twitterUrl}
                  onChange={handleInputChange}
                  placeholder="Twitter/X URL"
                  className="flex-1 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">🌐</span>
                <input
                  name="otherUrl"
                  value={formData.otherUrl}
                  onChange={handleInputChange}
                  placeholder="Other URL (ProductHunt, etc.)"
                  className="flex-1 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="px-6 py-3 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Startup Profile Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Startup</h2>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  ✏️ Edit
                </button>
              )}
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-blue-600">{profile?.startupName}</h3>
              <p className="text-gray-600 italic">{profile?.tagline}</p>
              <div className="border-t pt-3 space-y-2 text-sm">
                <p><strong>Founder:</strong> {profile?.founderName}</p>
                <p><strong>Stage:</strong> {profile?.stage || <span className="text-orange-500">Not set</span>}</p>
                <p><strong>Industry:</strong> {profile?.industry || <span className="text-orange-500">Not set</span>}</p>
                <p><strong>Location:</strong> {profile?.location || <span className="text-orange-500">Not set</span>}</p>
                <p><strong>Phone:</strong> {profile?.phone || <span className="text-orange-500">Not set</span>}</p>
                <p><strong>Website:</strong> {profile?.website || <span className="text-orange-500">Not set</span>}</p>
                <p><strong>Team Size:</strong> {profile?.teamSize || <span className="text-orange-500">Not set</span>}</p>
                <p><strong>Funding Goal:</strong> {profile?.funding || <span className="text-orange-500">Not set</span>}</p>
              </div>
              {/* Social Links */}
              <div className="border-t pt-3">
                <p className="font-medium text-gray-700 mb-2">Social Links:</p>
                <div className="flex gap-3">
                  {profile?.socialLinks?.linkedin ? (
                    <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      LinkedIn
                    </a>
                  ) : <span className="text-orange-500 text-sm">LinkedIn not set</span>}
                  {profile?.socialLinks?.twitter ? (
                    <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600">
                      Twitter
                    </a>
                  ) : <span className="text-orange-500 text-sm">Twitter not set</span>}
                  {profile?.socialLinks?.other && (
                    <a href={profile.socialLinks.other} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800">
                      Other
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <p className="text-3xl font-bold text-yellow-600">{pendingConnections.length}</p>
                <p className="text-gray-600">Pending Requests</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <p className="text-3xl font-bold text-green-600">{acceptedConnections.length}</p>
                <p className="text-gray-600">Connected Investors</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <p className="text-3xl font-bold text-blue-600">{connections.length}</p>
                <p className="text-gray-600">Total Interest</p>
              </div>
            </div>

            {/* Pending Requests - Notifications */}
            {pendingConnections.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6">
                <p className="font-semibold text-yellow-800">
                  🔔 You have {pendingConnections.length} new investor request(s)!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Interested Investors */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-6">Interested Investors</h2>
          
          {connections.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
              <p>No investor requests yet. Keep building! 🚀</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {connections.map((connection) => (
                <div
                  key={connection._id}
                  className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${
                    connection.status === "pending"
                      ? "border-yellow-400"
                      : connection.status === "accepted"
                      ? "border-green-400"
                      : "border-red-400"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {connection.investorId?.fullName || "Investor"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {connection.investorId?.userId?.email}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        connection.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : connection.status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {connection.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {connection.investorId?.firm && (
                      <p><strong>Firm:</strong> {connection.investorId.firm}</p>
                    )}
                    {connection.investorId?.sectors?.length > 0 && (
                      <p><strong>Sectors:</strong> {connection.investorId.sectors.join(", ")}</p>
                    )}
                    {connection.investorId?.bio && (
                      <p><strong>Bio:</strong> {connection.investorId.bio}</p>
                    )}
                    {connection.message && (
                      <p className="italic text-gray-500">"{connection.message}"</p>
                    )}
                  </div>

                  {connection.status === "pending" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => updateConnectionStatus(connection._id, "accepted")}
                        className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateConnectionStatus(connection._id, "rejected")}
                        className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {connection.status === "accepted" && (
                    <div className="bg-green-50 p-3 rounded text-center">
                      <p className="text-sm text-green-800">
                        📧 Contact: {connection.investorId?.userId?.email}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
