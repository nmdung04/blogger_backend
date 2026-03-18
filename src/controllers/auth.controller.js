import { signJwt } from "../config/jwt.js";
import { findAdminByEmail, validatePassword } from "../services/auth.service.js";

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ ok: false, message: "Email and password are required" });
  }

  const user = await findAdminByEmail(email);
  if (!user) {
    return res.status(401).json({ ok: false, message: "Invalid credentials" });
  }

  const valid = await validatePassword(user, password);
  if (!valid) {
    return res.status(401).json({ ok: false, message: "Invalid credentials" });
  }

  const token = signJwt({ sub: user.id, role: user.role });
  res.json({ ok: true, token });
}
