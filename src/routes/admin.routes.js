import { Router } from "express";
import { requireAdmin } from "../middlewares/auth.middleware.js";
import {
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/course.controller.js";
import {
  createPost,
  updatePost,
  deletePost,
} from "../controllers/post.controller.js";

const router = Router();

router.use(requireAdmin);

router.post("/courses", createCourse);
router.put("/courses/:courseId", updateCourse);
router.delete("/courses/:courseId", deleteCourse);

router.post("/courses/:courseId/posts", createPost);
router.put("/courses/:courseId/posts/:postId", updatePost);
router.delete("/courses/:courseId/posts/:postId", deletePost);

export default router;
