import * as courseService from "../services/course.service.js";
import { makeSlug } from "../utils/slugify.js";

export async function listCourses(req, res) {
  const courses = await courseService.listCourses();
  res.json({ ok: true, data: courses });
}

export async function getCourse(req, res) {
  const { courseId } = req.params;
  const course = await courseService.getCourseById(courseId);
  if (!course) {
    return res.status(404).json({ ok: false, message: "Course not found" });
  }
  res.json({ ok: true, data: course });
}

export async function createCourse(req, res) {
  const data = { ...req.body };
  if (!data.slug && data.title) {
    data.slug = makeSlug(data.title);
  }

  const course = await courseService.createCourse(data);
  res.status(201).json({ ok: true, data: course });
}

export async function updateCourse(req, res) {
  const { courseId } = req.params;
  const data = { ...req.body };
  if (!data.slug && data.title) {
    data.slug = makeSlug(data.title);
  }

  const course = await courseService.updateCourse(courseId, data);
  if (!course) {
    return res.status(404).json({ ok: false, message: "Course not found" });
  }
  res.json({ ok: true, data: course });
}

export async function deleteCourse(req, res) {
  const { courseId } = req.params;
  const course = await courseService.deleteCourse(courseId);
  if (!course) {
    return res.status(404).json({ ok: false, message: "Course not found" });
  }
  res.json({ ok: true, message: "Course deleted" });
}
