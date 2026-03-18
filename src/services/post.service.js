import { Post } from "../models/post.model.js";

export function listPostsByCourse(courseId, filter = {}) {
  return Post.find({ course: courseId, ...filter }).sort({ createdAt: -1 });
}

export function getPostById(postId) {
  return Post.findById(postId);
}

export function getPostByCourseAndSlug(courseId, slug) {
  return Post.findOne({ course: courseId, slug });
}

export function createPost(data) {
  const post = new Post(data);
  return post.save();
}

export function updatePost(postId, data) {
  return Post.findByIdAndUpdate(postId, data, { new: true });
}

export function deletePost(postId) {
  return Post.findByIdAndDelete(postId);
}
