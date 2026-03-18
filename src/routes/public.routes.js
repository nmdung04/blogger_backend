import { Router } from "express";
import { listCourses, getCourse } from "../controllers/course.controller.js";
import { listPostsByCourse, getPost } from "../controllers/post.controller.js";

const router = Router();

router.get("/courses", listCourses);
router.get("/courses/:courseId", getCourse);
router.get("/courses/:courseId/posts", listPostsByCourse);
router.get("/courses/:courseId/posts/:postId", getPost);

export default router;
