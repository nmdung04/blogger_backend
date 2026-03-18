import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Course = mongoose.model("Course", courseSchema);
