import { Course } from "../models/course.model.js";

export function listCourses(filter = {}) {
  return Course.find(filter).sort({ createdAt: -1 });
}

export function getCourseById(id) {
  return Course.findById(id);
}

export function getCourseBySlug(slug) {
  return Course.findOne({ slug });
}

export function createCourse(data) {
  const course = new Course(data);
  return course.save();
}

export function updateCourse(id, data) {
  return Course.findByIdAndUpdate(id, data, { new: true });
}

export function deleteCourse(id) {
  return Course.findByIdAndDelete(id);
}
