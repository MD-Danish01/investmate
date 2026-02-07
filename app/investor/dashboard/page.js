"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function InvestorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [startups, setStartups] = useState([]);
  const [myConnections, setMyConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    firm: "",
    website: "",
    location: "",
    bio: "",
    sectors: "",
  });
  const profilePanelRef = useRef(null);
  const [filters, setFilters] = useState({
    industry: "all",
    stage: "all",
    search: "",
  });
  // AI Features State
  const [aiMatching, setAiMatching] = useState(false);
  const [aiCoaching, setAiCoaching] = useState(false);
  const [aiMatches, setAiMatches] = useState(null);
  const [aiCoachResult, setAiCoachResult] = useState(null);
  const [showAiMatchModal, setShowAiMatchModal] = useState(false);
  const [showAiCoachModal, setShowAiCoachModal] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchStartups();
    fetchMyConnections();
  }, []);

  useEffect(() => {
    fetchStartups();
  }, [filters]);

  // Populate profile form when user data loads
  useEffect(() => {
    if (user?.profile) {
      setProfileForm({
        fullName: user.profile.fullName || "",
        phone: user.profile.phone || "",
        firm: user.profile.firm || "",
        website: user.profile.website || "",
        location: user.profile.location || "",
        bio: user.profile.bio || "",
        sectors: Array.isArray(user.profile.sectors) ? user.profile.sectors.join(", ") : "",
      });
    }
  }, [user]);

  // Close profile panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profilePanelRef.current && !profilePanelRef.current.contains(event.target)) {
        setShowProfilePanel(false);
      }
    };
    if (showProfilePanel) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfilePanel]);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/auth/me?role=investor");
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
    await fetch("/api/auth/logout?role=investor", { method: "POST" });
    router.push("/");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("File size exceeds 2MB limit.");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("role", "investor");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUser((prev) => ({
          ...prev,
          profile: { ...prev.profile, profilePicture: data.imageUrl },
        }));
        alert("Profile picture updated!");
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      alert("Error uploading image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const dataToSave = {
        ...profileForm,
        sectors: profileForm.sectors.split(",").map((s) => s.trim()).filter(Boolean),
      };

      const res = await fetch("/api/investor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      if (res.ok) {
        const updated = await res.json();
        setUser((prev) => ({ ...prev, profile: updated }));
        alert("Profile updated successfully!");
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      alert("Error updating profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (res.ok) {
        alert("Password changed successfully!");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      alert("Error changing password");
    } finally {
      setChangingPassword(false);
    }
  };

  // AI Features Functions
  const handleAiMatching = async () => {
    setAiMatching(true);
    setAiMatches(null);
    try {
      const res = await fetch("/api/ai/matchmaking/investor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      console.log("Full AI response:", data);
      console.log("Matches array:", data.matches);
      console.log("Raw data:", data.raw);
      
      if (data.success) {
        // If matches is empty array but raw has data, try to extract from raw
        let matches = data.matches;
        if ((!matches || matches.length === 0 || (Array.isArray(matches) && matches.every(m => Object.keys(m || {}).length === 0))) && data.raw) {
          console.log("Matches empty, trying to parse raw:", data.raw);
          if (typeof data.raw === "object" && !Array.isArray(data.raw)) {
            // Convert object with named keys to array
            matches = Object.entries(data.raw).map(([key, value]) => ({
              name: key,
              ...(typeof value === "object" ? value : { description: value })
            }));
          } else if (Array.isArray(data.raw)) {
            matches = data.raw;
          }
        }
        setAiMatches(matches);
        setShowAiMatchModal(true);
      } else {
        alert(data.error || "AI matching failed");
      }
    } catch (error) {
      console.error("AI Matching error:", error);
      alert("Error connecting to AI service");
    } finally {
      setAiMatching(false);
    }
  };

  const handleAiCoaching = async () => {
    setAiCoaching(true);
    setAiCoachResult(null);
    try {
      const res = await fetch("/api/ai/coach/investor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setAiCoachResult(data.coaching);
        setShowAiCoachModal(true);
      } else {
        alert(data.error || "AI coaching failed");
      }
    } catch (error) {
      alert("Error connecting to AI service");
    } finally {
      setAiCoaching(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">Investmate</Link>
          <div className="flex items-center gap-4">
            {/* Investor Profile - Clickable */}
            <div 
              className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-full cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setShowProfilePanel(!showProfilePanel)}
            >
              <div className="relative w-10 h-10">
                <Image
                  src={user?.profile?.profilePicture || "/default-avatar.png"}
                  alt={user?.profile?.fullName || "Investor"}
                  fill
                  unoptimized
                  className="rounded-full object-cover border-2 border-green-200"
                />
              </div>
              <div className="text-sm">
                <p className="text-gray-500 text-xs">Investor</p>
                <p className="font-medium text-gray-700">{user?.profile?.fullName || user?.user?.name || "N/A"}</p>
              </div>
              <span className="text-gray-400 text-xs">{showProfilePanel ? "▲" : "▼"}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Profile Panel Dropdown */}
        {showProfilePanel && (
          <div 
            ref={profilePanelRef}
            className="absolute right-4 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border z-50 max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center mb-6 pb-6 border-b">
                <div className="relative w-24 h-24 mb-3 group">
                  <Image
                    src={user?.profile?.profilePicture || "/default-avatar.png"}
                    alt={user?.profile?.fullName || "Investor"}
                    fill
                    unoptimized
                    className="rounded-full object-cover border-4 border-green-100 shadow-lg"
                  />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Image
                      src="/upload-icon.jpg"
                      alt="Upload"
                      width={28}
                      height={28}
                      className="opacity-90"
                    />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500">{uploadingImage ? "Uploading..." : "Click to change photo"}</p>
              </div>

              {/* Profile Form */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-800">Profile Information</h3>
                
                <div>
                  <label className="text-xs text-gray-500">Full Name</label>
                  <input
                    name="fullName"
                    value={profileForm.fullName}
                    onChange={handleProfileFormChange}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">Phone</label>
                  <input
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileFormChange}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">Investment Firm</label>
                  <input
                    name="firm"
                    value={profileForm.firm}
                    onChange={handleProfileFormChange}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="Firm name (optional)"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">Website</label>
                  <input
                    name="website"
                    value={profileForm.website}
                    onChange={handleProfileFormChange}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">Location</label>
                  <input
                    name="location"
                    value={profileForm.location}
                    onChange={handleProfileFormChange}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">Investment Sectors</label>
                  <input
                    name="sectors"
                    value={profileForm.sectors}
                    onChange={handleProfileFormChange}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="FinTech, EdTech, AI/ML..."
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">Bio</label>
                  <textarea
                    name="bio"
                    value={profileForm.bio}
                    onChange={handleProfileFormChange}
                    rows={3}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
                    placeholder="Tell startups about yourself..."
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                >
                  {savingProfile ? "Saving..." : "Save Profile"}
                </button>
              </div>

              {/* Change Password Section */}
              <div className="pt-6 border-t">
                <h3 className="font-semibold text-gray-800 mb-4">Change Password</h3>
                
                <div className="space-y-3">
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="Current password"
                  />
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="New password (min 6 chars)"
                  />
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="Confirm new password"
                  />
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 text-sm font-medium"
                  >
                    {changingPassword ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-10">
          {startups.length === 0 ? (
            <p className="text-gray-500 col-span-full text-center py-8">No startups found</p>
          ) : (
            startups.map((startup) => (
              <div key={startup._id} className="bg-white rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition-shadow overflow-visible mt-12">
                {/* Cover Image */}
                <div className="relative h-40 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl">
                  {startup.coverImage && (
                    <Image
                      src={startup.coverImage}
                      alt="Cover"
                      fill
                      unoptimized
                      className="object-cover rounded-t-2xl"
                    />
                  )}
                  {/* Stage & Industry Badges */}
                  <div className="absolute bottom-2 left-2 flex gap-2">
                    <span className="text-xs bg-white/90 text-blue-800 px-2 py-1 rounded-full shadow">
                      {startup.stage}
                    </span>
                    {startup.industry && (
                      <span className="text-xs bg-white/90 text-purple-800 px-2 py-1 rounded-full shadow">
                        {startup.industry}
                      </span>
                    )}
                  </div>
                </div>

                {/* Profile Picture - Overlapping */}
                <div className="relative flex justify-center -mt-10">
                  <div className="relative w-20 h-20">
                    <Image
                      src={startup.profilePicture || "/default-avatar.png"}
                      alt={startup.startupName}
                      fill
                      unoptimized
                      className="rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2">
                  <div className="text-center mb-3">
                    <h3 className="text-xl font-bold text-gray-800">{startup.startupName}</h3>
                    <p className="text-gray-500 text-sm italic mt-1">{startup.tagline}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span className="text-gray-600">{startup.founderName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span className="text-gray-600">{startup.location || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>💰</span>
                      <span className="text-gray-600">{startup.funding || "N/A"}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400 mb-1">Problem Statement</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{startup.problem}</p>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => setSelectedStartup(startup)}
                    className="w-full mt-4 mb-3 border-2 border-blue-500 text-blue-600 py-2.5 rounded-xl font-medium hover:bg-blue-50 transition-colors"
                  >
                    View Full Details
                  </button>
                  
                  {isConnected(startup._id) ? (
                    <div className={`text-center py-2.5 rounded-xl font-medium ${
                      getConnectionStatus(startup._id) === "accepted" 
                        ? "bg-green-100 text-green-700" 
                        : getConnectionStatus(startup._id) === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {getConnectionStatus(startup._id) === "accepted" && "✓ Connected"}
                      {getConnectionStatus(startup._id) === "rejected" && "✗ Declined"}
                      {getConnectionStatus(startup._id) === "pending" && "⏳ Pending"}
                    </div>
                  ) : (
                    <button
                      onClick={() => expressInterest(startup._id)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                    >
                      Express Interest
                    </button>
                  )}
                </div>
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

      {/* Startup Detail Modal */}
      {selectedStartup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-start">
              <div className="flex items-center gap-4">
                {/* Startup Profile Picture in Modal */}
                <div className="relative w-16 h-16 flex-shrink-0">
                  <Image
                    src={selectedStartup.profilePicture || "/default-avatar.png"}
                    alt={selectedStartup.startupName}
                    fill
                    unoptimized
                    className="rounded-full object-cover border-2 border-gray-200"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-800">{selectedStartup.startupName}</h2>
                    <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      {selectedStartup.stage}
                    </span>
                    {selectedStartup.industry && (
                      <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                        {selectedStartup.industry}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 italic">{selectedStartup.tagline}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStartup(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Founder & Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    👤 Founder Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedStartup.founderName}</p>
                    <p><strong>Email:</strong> {selectedStartup.userId?.email || "N/A"}</p>
                    <p><strong>Phone:</strong> {selectedStartup.phone || "Not provided"}</p>
                    <p><strong>Location:</strong> {selectedStartup.location || "Not provided"}</p>
                    {selectedStartup.website && (
                      <p>
                        <strong>Website:</strong>{" "}
                        <a href={selectedStartup.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {selectedStartup.website}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    🏢 Company Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Stage:</strong> {selectedStartup.stage}</p>
                    <p><strong>Industry:</strong> {selectedStartup.industry || "N/A"}</p>
                    <p><strong>Team Size:</strong> {selectedStartup.teamSize || "N/A"}</p>
                    <p><strong>Tech Stack:</strong> {selectedStartup.techStack || "N/A"}</p>
                    <p><strong>Previous Funding:</strong> {selectedStartup.prevFunding || "No"}</p>
                  </div>
                </div>
              </div>

              {/* Problem & Solution */}
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                    ❓ Problem
                  </h3>
                  <p className="text-gray-700">{selectedStartup.problem}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                    💡 Solution
                  </h3>
                  <p className="text-gray-700">{selectedStartup.solution}</p>
                </div>

                {selectedStartup.valueProp && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                      ⭐ Value Proposition
                    </h3>
                    <p className="text-gray-700">{selectedStartup.valueProp}</p>
                  </div>
                )}
              </div>

              {/* Market & Traction */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedStartup.market && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">🎯 Target Market</h3>
                    <p className="text-sm text-gray-600">{selectedStartup.market}</p>
                  </div>
                )}
                {selectedStartup.traction && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">📈 Traction</h3>
                    <p className="text-sm text-gray-600">{selectedStartup.traction}</p>
                  </div>
                )}
                {selectedStartup.revenueModel && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">💵 Revenue Model</h3>
                    <p className="text-sm text-gray-600">{selectedStartup.revenueModel}</p>
                  </div>
                )}
              </div>

              {/* Funding */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                  💰 Funding Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <p><strong>Funding Required:</strong> {selectedStartup.funding || "Not specified"}</p>
                  <p><strong>Previous Funding:</strong> {selectedStartup.prevFunding === "Yes" ? "Yes" : "No"}</p>
                  {selectedStartup.fundUsage && (
                    <div className="md:col-span-2">
                      <strong>Use of Funds:</strong>
                      <p className="mt-1 text-gray-600">{selectedStartup.fundUsage}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">🔗 Social Links</h3>
                {(selectedStartup.socialLinks?.linkedin || selectedStartup.socialLinks?.twitter || selectedStartup.socialLinks?.other) ? (
                  <div className="flex flex-wrap gap-4 text-sm">
                    {selectedStartup.socialLinks?.linkedin && (
                      <a href={selectedStartup.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                        <span>🔗</span> LinkedIn
                      </a>
                    )}
                    {selectedStartup.socialLinks?.twitter && (
                      <a href={selectedStartup.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                        <span>🐦</span> Twitter/X
                      </a>
                    )}
                    {selectedStartup.socialLinks?.other && (
                      <a href={selectedStartup.socialLinks.other} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-600 hover:underline">
                        <span>🌐</span> Other
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No social links provided</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t p-6 flex gap-4">
              {isConnected(selectedStartup._id) ? (
                <div className={`flex-1 text-center py-3 rounded ${
                  getConnectionStatus(selectedStartup._id) === "accepted" 
                    ? "bg-green-100 text-green-800" 
                    : getConnectionStatus(selectedStartup._id) === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {getConnectionStatus(selectedStartup._id) === "accepted" && "✓ Connected - You can contact this startup"}
                  {getConnectionStatus(selectedStartup._id) === "rejected" && "✗ Connection Declined"}
                  {getConnectionStatus(selectedStartup._id) === "pending" && "⏳ Connection Request Pending"}
                </div>
              ) : (
                <button
                  onClick={() => {
                    expressInterest(selectedStartup._id);
                    setSelectedStartup(null);
                  }}
                  className="flex-1 bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition-colors font-medium"
                >
                  Express Interest in {selectedStartup.startupName}
                </button>
              )}
              <button
                onClick={() => setSelectedStartup(null)}
                className="px-6 py-3 border rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Match Results Modal */}
      {showAiMatchModal && aiMatches && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAiMatchModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Fixed Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <span>🎯</span> AI-Matched Startups
                  </h2>
                  <p className="text-purple-100 mt-1">Click on a startup to view full details</p>
                </div>
                <button
                  onClick={() => setShowAiMatchModal(false)}
                  className="text-white/80 hover:text-white text-2xl p-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {Array.isArray(aiMatches) && aiMatches.length > 0 ? (
                aiMatches.map((match, index) => (
                  <div 
                    key={index} 
                    className={`bg-white rounded-xl shadow-md border-2 overflow-hidden transition-all ${
                      match._id 
                        ? "border-purple-200 hover:border-purple-400 hover:shadow-lg cursor-pointer" 
                        : "border-gray-200"
                    }`}
                    onClick={() => {
                      if (match._id) {
                        // Use match data directly or find from startups list
                        const fullStartup = startups.find(s => s._id === match._id || s._id.toString() === match._id);
                        if (fullStartup) {
                          setSelectedStartup(fullStartup);
                        } else {
                          // Use match data as the startup details
                          setSelectedStartup({
                            ...match,
                            _id: match._id,
                          });
                        }
                        // Keep AI modal open - details modal has higher z-index
                      }
                    }}
                  >
                    <div className="flex gap-4 p-4">
                      {/* Profile Picture */}
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={match.profilePicture && match.profilePicture !== "/default-avatar.png" ? match.profilePicture : "/default-avatar.png"}
                          alt={match.startupName || "Startup"}
                          fill
                          unoptimized
                          className="rounded-full object-cover border-2 border-purple-100 bg-gray-100"
                        />
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800">{match.startupName || `Match ${index + 1}`}</h3>
                            {match.tagline && <p className="text-sm text-gray-500 italic line-clamp-1">{match.tagline}</p>}
                            {match.founderName && <p className="text-sm text-gray-600">by {match.founderName}</p>}
                          </div>
                          <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold flex-shrink-0">
                            #{match.matchIndex || index + 1}
                          </span>
                        </div>
                        
                        {/* Meta info */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {match.industry && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{match.industry}</span>
                          )}
                          {match.stage && (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">{match.stage}</span>
                          )}
                          {match.location && (
                            <span className="text-gray-500 text-xs flex items-center gap-1">📍 {match.location}</span>
                          )}
                          {match.funding && (
                            <span className="text-gray-500 text-xs flex items-center gap-1">💰 {match.funding}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Reason */}
                    {match.aiReason && (
                      <div className="bg-purple-50 p-4 border-t border-purple-100">
                        <p className="text-sm text-purple-800">
                          <strong className="text-purple-900">🤖 Why this match:</strong>{" "}
                          {match.aiReason}
                        </p>
                      </div>
                    )}
                    
                    {/* Click hint */}
                    {match._id && (
                      <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 text-center text-xs text-purple-700 font-medium border-t">
                        👆 Click to view full details & express interest
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-4xl mb-3">🔍</p>
                  <p>No matches found. Try updating your investment profile with more details.</p>
                </div>
              )}
            </div>

            {/* Fixed Footer */}
            <div className="bg-white border-t p-4 rounded-b-2xl flex-shrink-0">
              <button
                onClick={() => setShowAiMatchModal(false)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Coach Results Modal */}
      {showAiCoachModal && aiCoachResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAiCoachModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Fixed Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <span>💡</span> AI Investment Coach
                  </h2>
                  <p className="text-yellow-100 mt-1">Strategic insights tailored to your investment portfolio</p>
                </div>
                <button
                  onClick={() => setShowAiCoachModal(false)}
                  className="text-white/80 hover:text-white text-2xl p-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Investor Analysis - Handle nested object */}
              {aiCoachResult.investor_analysis && (
                <div className="bg-blue-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <span>📊</span> Investor Analysis
                  </h3>
                  {typeof aiCoachResult.investor_analysis === "object" ? (
                    <div className="space-y-4">
                      {Object.entries(aiCoachResult.investor_analysis).map(([key, value]) => (
                        <div key={key} className="bg-white p-3 rounded-lg">
                          <h4 className="font-semibold text-blue-700 capitalize mb-1">
                            {key.replace(/_/g, " ")}
                          </h4>
                          <p className="text-gray-700 text-sm whitespace-pre-line">
                            {typeof value === "object" ? JSON.stringify(value, null, 2) : value}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-line">{aiCoachResult.investor_analysis}</p>
                  )}
                </div>
              )}

              {/* Strategic Recommendations - Handle nested object */}
              {aiCoachResult.strategic_recommendations && (
                <div className="bg-green-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                    <span>🎯</span> Strategic Recommendations
                  </h3>
                  {Array.isArray(aiCoachResult.strategic_recommendations) ? (
                    <ul className="space-y-2">
                      {aiCoachResult.strategic_recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>{typeof rec === "object" ? JSON.stringify(rec) : rec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : typeof aiCoachResult.strategic_recommendations === "object" ? (
                    <div className="space-y-4">
                      {Object.entries(aiCoachResult.strategic_recommendations).map(([key, value]) => (
                        <div key={key} className="bg-white p-3 rounded-lg">
                          <h4 className="font-semibold text-green-700 capitalize mb-1">
                            {key.replace(/_/g, " ")}
                          </h4>
                          {Array.isArray(value) ? (
                            <ul className="space-y-1">
                              {value.map((item, idx) => (
                                <li key={idx} className="text-gray-700 text-sm flex items-start gap-2">
                                  <span className="text-green-600">•</span>
                                  <span>{typeof item === "object" ? JSON.stringify(item) : item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-700 text-sm whitespace-pre-line">
                              {typeof value === "object" ? JSON.stringify(value, null, 2) : value}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-line">{aiCoachResult.strategic_recommendations}</p>
                  )}
                </div>
              )}

              {/* Actionable Roadmap - Handle nested object */}
              {aiCoachResult.actionable_roadmap && (
                <div className="bg-purple-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                    <span>🗺️</span> Actionable Roadmap
                  </h3>
                  {Array.isArray(aiCoachResult.actionable_roadmap) ? (
                    <ol className="space-y-3">
                      {aiCoachResult.actionable_roadmap.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 text-gray-700">
                          <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">
                            {i + 1}
                          </span>
                          <span>{typeof step === "object" ? JSON.stringify(step) : step}</span>
                        </li>
                      ))}
                    </ol>
                  ) : typeof aiCoachResult.actionable_roadmap === "object" ? (
                    <div className="space-y-4">
                      {Object.entries(aiCoachResult.actionable_roadmap).map(([key, value]) => (
                        <div key={key} className="bg-white p-3 rounded-lg">
                          <h4 className="font-semibold text-purple-700 capitalize mb-1">
                            {key.replace(/_/g, " ")}
                          </h4>
                          {Array.isArray(value) ? (
                            <ul className="space-y-1">
                              {value.map((item, idx) => (
                                <li key={idx} className="text-gray-700 text-sm flex items-start gap-2">
                                  <span className="text-purple-600">•</span>
                                  <span>{typeof item === "object" ? JSON.stringify(item) : item}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-700 text-sm whitespace-pre-line">
                              {typeof value === "object" ? JSON.stringify(value, null, 2) : value}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-line">{aiCoachResult.actionable_roadmap}</p>
                  )}
                </div>
              )}
            </div>

            {/* Fixed Footer */}
            <div className="bg-white border-t p-4 rounded-b-2xl flex-shrink-0">
              <button
                onClick={() => setShowAiCoachModal(false)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Chatbot Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {/* AI Menu Popup */}
        {showAiMenu && (
          <div className="absolute bottom-20 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <h3 className="font-bold">AI Assistant</h3>
                  <p className="text-xs text-purple-100">Find perfect matches & get advice</p>
                </div>
              </div>
            </div>
            
            {/* Options */}
            <div className="p-3 space-y-2">
              <button
                onClick={() => {
                  setShowAiMenu(false);
                  handleAiMatching();
                }}
                disabled={aiMatching}
                className="w-full p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all flex items-center gap-3 text-left disabled:opacity-50"
              >
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="font-semibold text-purple-800">AI Match Startups</p>
                  <p className="text-xs text-gray-500">Find startups that match your investment criteria</p>
                </div>
                {aiMatching && <span className="ml-auto animate-spin">⏳</span>}
              </button>
              
              <button
                onClick={() => {
                  setShowAiMenu(false);
                  handleAiCoaching();
                }}
                disabled={aiCoaching}
                className="w-full p-4 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-all flex items-center gap-3 text-left disabled:opacity-50"
              >
                <span className="text-2xl">💡</span>
                <div>
                  <p className="font-semibold text-yellow-800">AI Coach</p>
                  <p className="text-xs text-gray-500">Get strategic investment advice</p>
                </div>
                {aiCoaching && <span className="ml-auto animate-spin">⏳</span>}
              </button>
            </div>
          </div>
        )}
        
        {/* Main Floating Button */}
        <button
          onClick={() => setShowAiMenu(!showAiMenu)}
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
            showAiMenu 
              ? "bg-gray-700 rotate-45" 
              : "bg-white border-2 border-purple-200"
          }`}
        >
          {showAiMenu ? (
            <span className="text-white text-3xl">+</span>
          ) : (
            <Image
              src="/ai-bot.png"
              alt="AI Assistant"
              width={40}
              height={40}
              className="object-contain"
            />
          )}
        </button>
      </div>

      {/* Click outside to close AI menu */}
      {showAiMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowAiMenu(false)}
        />
      )}
    </div>
  );
}
