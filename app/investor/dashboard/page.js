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
              <div key={startup._id} className="bg-white rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition-shadow overflow-visible mt-10">
                {/* Cover Image */}
                <div className="relative h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl">
                  {startup.coverImage && (
                    <Image
                      src={startup.coverImage}
                      alt="Cover"
                      fill
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
    </div>
  );
}
