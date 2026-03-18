import * as postService from "../services/post.service.js";
import { makeSlug } from "../utils/slugify.js";

export async function listPostsByCourse(req, res) {
  const { courseId } = req.params;
  const posts = await postService.listPostsByCourse(courseId, { status: "published" });
  res.json({ ok: true, data: posts });
}

export async function getPost(req, res) {
  const { courseId, postId } = req.params;
  const post = await postService.getPostById(postId);
  if (!post || post.course.toString() !== courseId) {
    return res.status(404).json({ ok: false, message: "Post not found" });
  }
  res.json({ ok: true, data: post });
}

export async function createPost(req, res) {
  const { courseId } = req.params;
  const data = { ...req.body, course: courseId };
  if (!data.slug && data.title) {
    data.slug = makeSlug(data.title);
  }

  const post = await postService.createPost(data);
  res.status(201).json({ ok: true, data: post });
}

export async function updatePost(req, res) {
  const { courseId, postId } = req.params;
  const post = await postService.getPostById(postId);
  if (!post || post.course.toString() !== courseId) {
    return res.status(404).json({ ok: false, message: "Post not found" });
  }

  const data = { ...req.body };
  if (!data.slug && data.title) {
    data.slug = makeSlug(data.title);
  }

  const updated = await postService.updatePost(postId, data);
  res.json({ ok: true, data: updated });
}

export async function deletePost(req, res) {
  const { courseId, postId } = req.params;
  const post = await postService.getPostById(postId);
  if (!post || post.course.toString() !== courseId) {
    return res.status(404).json({ ok: false, message: "Post not found" });
  }
  await postService.deletePost(postId);
  res.json({ ok: true, message: "Post deleted" });
}
