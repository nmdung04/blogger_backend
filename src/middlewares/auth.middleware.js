import { verifyJwt } from "../config/jwt.js";

export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, message: "Missing authorization token" });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = verifyJwt(token);
    if (!payload || payload.role !== "admin") {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: "Invalid or expired token" });
  }
}
