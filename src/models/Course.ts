import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a course title."],
    maxlength: [300, "Title cannot exceed 300 characters"],
  },
  url: {
    type: String,
    default: "",
  },
  platform: {
    type: String,
    default: "",
  },
  thumbnail: {
    type: String,
    default: "",
  },
  notes: {
    type: String,
    default: "",
  },
  progress: {
    type: Number,
    default: 0, // 0–100 percentage
    min: 0,
    max: 100,
  },
  status: {
    type: String,
    enum: ["watching", "completed", "paused"],
    default: "watching",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Course || mongoose.model("Course", CourseSchema);