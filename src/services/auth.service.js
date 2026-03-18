import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";

export async function findAdminByEmail(email) {
  return User.findOne({ email });
}

export async function createAdminIfNotExists({ email, password, name = "Administrator" }) {
  const existing = await User.findOne({ email });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(password, 12);
  const user = new User({ email, passwordHash, name, role: "admin" });
  return user.save();
}

export async function validatePassword(user, password) {
  if (!user) return false;
  return bcrypt.compare(password, user.passwordHash);
}
