"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function StartupDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
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
      const res = await fetch("/api/auth/me?role=startup");
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
    await fetch("/api/auth/logout?role=startup", { method: "POST" });
    router.push("/");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
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
      formData.append("role", "startup");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => ({ ...prev, profilePicture: data.imageUrl }));
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

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "cover");
      formData.append("role", "startup");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => ({ ...prev, coverImage: data.imageUrl }));
        alert("Cover image updated!");
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      alert("Error uploading cover image");
    } finally {
      setUploadingCover(false);
    }
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

  // AI Features Functions
  const handleAiMatching = async () => {
    setAiMatching(true);
    setAiMatches(null);
    try {
      const res = await fetch("/api/ai/matchmaking/startup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setAiMatches(data.matches);
        setShowAiMatchModal(true);
      } else {
        alert(data.error || "AI matching failed");
      }
    } catch (error) {
      alert("Error connecting to AI service");
    } finally {
      setAiMatching(false);
    }
  };

  const handleAiCoaching = async () => {
    setAiCoaching(true);
    setAiCoachResult(null);
    try {
      const res = await fetch("/api/ai/coach/startup", {
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
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
            {/* Cover Image */}
            <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600 group">
              {profile?.coverImage ? (
                <Image
                  src={profile.coverImage}
                  alt="Cover"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : null}
              <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <div className="text-white text-center">
                  <Image
                    src="/upload-icon.jpg"
                    alt="Upload"
                    width={28}
                    height={28}
                    className="mx-auto mb-1 opacity-90"
                  />
                  <span className="text-xs">{uploadingCover ? "Uploading..." : "Change Cover"}</span>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverImageUpload}
                  className="hidden"
                  disabled={uploadingCover}
                />
              </label>
              {/* Edit Button */}
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="absolute top-3 right-3 px-3 py-1 bg-white/90 text-blue-700 rounded-full text-sm hover:bg-white transition-colors shadow"
                >
                  ✏️ Edit
                </button>
              )}
            </div>

            {/* Profile Picture - Overlapping */}
            <div className="relative flex justify-center -mt-14">
              <div className="relative w-28 h-28 group">
                <Image
                  src={profile?.profilePicture || "/default-avatar.png"}
                  alt={profile?.startupName || "Startup"}
                  fill
                  unoptimized
                  className="rounded-full object-cover border-4 border-white shadow-lg"
                />
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Image
                    src="/upload-icon.jpg"
                    alt="Upload"
                    width={32}
                    height={32}
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
            </div>

            <div className="px-6 pb-6 pt-2">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{profile?.startupName}</h3>
                <p className="text-gray-500 italic text-sm mt-1">{profile?.tagline}</p>
                <span className="text-xs text-gray-400">{uploadingImage ? "Uploading photo..." : ""}</span>
              </div>

              <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <div>
                      <p className="text-gray-400 text-xs">Founder</p>
                      <p className="font-medium text-gray-700">{profile?.founderName || <span className="text-orange-400">Not set</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    <div>
                      <p className="text-gray-400 text-xs">Stage</p>
                      <p className="font-medium text-gray-700">{profile?.stage || <span className="text-orange-400">Not set</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏭</span>
                    <div>
                      <p className="text-gray-400 text-xs">Industry</p>
                      <p className="font-medium text-gray-700">{profile?.industry || <span className="text-orange-400">Not set</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📍</span>
                    <div>
                      <p className="text-gray-400 text-xs">Location</p>
                      <p className="font-medium text-gray-700">{profile?.location || <span className="text-orange-400">Not set</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📞</span>
                    <div>
                      <p className="text-gray-400 text-xs">Phone</p>
                      <p className="font-medium text-gray-700">{profile?.phone || <span className="text-orange-400">Not set</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌐</span>
                    <div>
                      <p className="text-gray-400 text-xs">Website</p>
                      <p className="font-medium text-gray-700 truncate">{profile?.website || <span className="text-orange-400">Not set</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👥</span>
                    <div>
                      <p className="text-gray-400 text-xs">Team Size</p>
                      <p className="font-medium text-gray-700">{profile?.teamSize || <span className="text-orange-400">Not set</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <div>
                      <p className="text-gray-400 text-xs">Funding Goal</p>
                      <p className="font-medium text-gray-700">{profile?.funding || <span className="text-orange-400">Not set</span>}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="font-medium text-gray-700 mb-3 text-sm text-center">🔗 Social Links</p>
                <div className="flex justify-center gap-4">
                  {profile?.socialLinks?.linkedin ? (
                    <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors" title="LinkedIn">
                      🔗
                    </a>
                  ) : <span className="p-2 bg-gray-100 rounded-full text-gray-400" title="LinkedIn not set">🔗</span>}
                  {profile?.socialLinks?.twitter ? (
                    <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors" title="Twitter">
                      🐦
                    </a>
                  ) : <span className="p-2 bg-gray-100 rounded-full text-gray-400" title="Twitter not set">🐦</span>}
                  {profile?.socialLinks?.other && (
                    <a href={profile.socialLinks.other} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors" title="Other">
                      🌐
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

      {/* AI Match Results Modal */}
      {showAiMatchModal && aiMatches && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAiMatchModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Fixed Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <span>🔍</span> AI-Matched Investors & Partners
                  </h2>
                  <p className="text-blue-100 mt-1">Click on a match to learn more</p>
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
                    className="bg-white rounded-xl shadow-md border-2 border-blue-200 overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all"
                  >
                    <div className="flex gap-4 p-4">
                      {/* Profile Picture */}
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={match.profilePicture && match.profilePicture !== "/default-avatar.png" ? match.profilePicture : "/default-avatar.png"}
                          alt={match.name || "Partner"}
                          fill
                          unoptimized
                          className="rounded-full object-cover border-2 border-blue-100 bg-gray-100"
                        />
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800">{match.name || `Partner ${index + 1}`}</h3>
                            {match.tagline && <p className="text-sm text-gray-500 italic line-clamp-1">{match.tagline}</p>}
                            {match.firm && <p className="text-sm text-gray-500">{match.firm}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                              #{match.matchIndex || index + 1}
                            </span>
                            {match.type && (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                match.type === "investor" 
                                  ? "bg-green-100 text-green-700" 
                                  : "bg-purple-100 text-purple-700"
                              }`}>
                                {match.type}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Meta info */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {match.industry && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{match.industry}</span>
                          )}
                          {match.stage && (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">{match.stage}</span>
                          )}
                          {match.sectors && (
                            <span className="text-gray-500 text-xs">
                              {Array.isArray(match.sectors) ? match.sectors.join(", ") : match.sectors}
                            </span>
                          )}
                          {match.location && (
                            <span className="text-gray-500 text-xs flex items-center gap-1">📍 {match.location}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Reason */}
                    {match.aiReason && (
                      <div className="bg-blue-50 p-4 border-t border-blue-100">
                        <p className="text-sm text-blue-800">
                          <strong className="text-blue-900">🤖 Why this match:</strong>{" "}
                          {match.aiReason}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-4xl mb-3">🔍</p>
                  <p>No matches found. Try completing your startup profile with more details.</p>
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
                    <span>💡</span> AI Startup Coach
                  </h2>
                  <p className="text-yellow-100 mt-1">Strategic analysis and actionable advice for your startup</p>
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
              {/* Startup Analysis - Handle nested object */}
              {aiCoachResult.analysis && (
                <div className="bg-blue-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <span>📊</span> Startup Analysis
                  </h3>
                  {typeof aiCoachResult.analysis === "object" ? (
                    <div className="space-y-4">
                      {Object.entries(aiCoachResult.analysis).map(([key, value]) => (
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
                    <p className="text-gray-700 whitespace-pre-line">{aiCoachResult.analysis}</p>
                  )}
                </div>
              )}

              {/* Actionable Advice - Handle nested object */}
              {aiCoachResult.actionable_advice && (
                <div className="bg-green-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                    <span>🎯</span> Actionable Advice
                  </h3>
                  {Array.isArray(aiCoachResult.actionable_advice) ? (
                    <ul className="space-y-2">
                      {aiCoachResult.actionable_advice.map((advice, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>{typeof advice === "object" ? JSON.stringify(advice) : advice}</span>
                        </li>
                      ))}
                    </ul>
                  ) : typeof aiCoachResult.actionable_advice === "object" ? (
                    <div className="space-y-4">
                      {Object.entries(aiCoachResult.actionable_advice).map(([key, value]) => (
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
                    <p className="text-gray-700 whitespace-pre-line">{aiCoachResult.actionable_advice}</p>
                  )}
                </div>
              )}

              {/* Coach Verdict - Handle nested object */}
              {aiCoachResult.coach_verdict && (
                <div className="bg-purple-50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                    <span>🏆</span> Coach Verdict
                  </h3>
                  {typeof aiCoachResult.coach_verdict === "object" ? (
                    <div className="space-y-4">
                      {Object.entries(aiCoachResult.coach_verdict).map(([key, value]) => (
                        <div key={key} className="bg-white p-3 rounded-lg">
                          <h4 className="font-semibold text-purple-700 capitalize mb-1">
                            {key.replace(/_/g, " ")}
                          </h4>
                          <p className="text-gray-700 text-sm whitespace-pre-line">
                            {typeof value === "object" ? JSON.stringify(value, null, 2) : value}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-line">{aiCoachResult.coach_verdict}</p>
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
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <h3 className="font-bold">AI Assistant</h3>
                  <p className="text-xs text-blue-100">Find investors & get startup advice</p>
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
                className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all flex items-center gap-3 text-left disabled:opacity-50"
              >
                <span className="text-2xl">🔍</span>
                <div>
                  <p className="font-semibold text-blue-800">Find Investors</p>
                  <p className="text-xs text-gray-500">AI will match you with suitable investors</p>
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
                  <p className="text-xs text-gray-500">Get strategic advice for your startup</p>
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
              : "bg-white border-2 border-blue-200"
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
