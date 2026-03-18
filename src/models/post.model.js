import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    contentHtml: { type: String, default: "" },
    thumbnail: { type: String, trim: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

postSchema.index({ course: 1, slug: 1 }, { unique: true });

export const Post = mongoose.model("Post", postSchema);
