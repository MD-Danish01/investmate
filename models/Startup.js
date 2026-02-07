import mongoose from "mongoose";

const startupSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    profilePicture: {
      type: String,
      default: "/default-avatar.png",
    },
    coverImage: {
      type: String,
      default: "",
    },
    startupName: {
      type: String,
      required: [true, "Startup name is required"],
      trim: true,
    },
    tagline: {
      type: String,
      required: [true, "Tagline is required"],
      maxlength: 200,
    },
    founderName: {
      type: String,
      required: [true, "Founder name is required"],
    },
    phone: String,
    location: String,
    website: String,
    stage: {
      type: String,
      enum: ["Idea", "MVP", "Launched", "Early Revenue", "Scaling"],
      default: "Idea",
    },
    industry: {
      type: String,
      enum: ["EdTech", "FinTech", "HealthTech", "AgriTech", "Logistics", "AI/ML", "SaaS", "Others"],
    },
    teamSize: {
      type: Number,
      min: 1,
    },
    problem: {
      type: String,
      required: [true, "Problem statement is required"],
    },
    solution: {
      type: String,
      required: [true, "Solution is required"],
    },
    valueProp: String,
    market: String,
    revenueModel: String,
    traction: String,
    techStack: String,
    funding: String,
    fundUsage: String,
    prevFunding: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    socialLinks: {
      linkedin: String,
      twitter: String,
      other: String,
    },
  },
  { timestamps: true }
);

// Index for search/filter
startupSchema.index({ industry: 1, stage: 1, location: 1 });

export default mongoose.models.Startup || mongoose.model("Startup", startupSchema);
