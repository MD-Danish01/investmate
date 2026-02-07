import mongoose from "mongoose";

const investorSchema = new mongoose.Schema(
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
    fullName: {
      type: String,
      required: [true, "Full name is required"],
    },
    phone: String,
    firm: String,
    website: String,
    sectors: {
      type: [String],
      default: [],
    },
    ticketSize: {
      min: Number,
      max: Number,
    },
    location: String,
    bio: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Index for filtering
investorSchema.index({ sectors: 1, location: 1 });

export default mongoose.models.Investor || mongoose.model("Investor", investorSchema);
