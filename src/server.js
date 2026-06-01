import dotenv from "dotenv";

dotenv.config();

const PORT = parseInt(process.env.PORT || "4000", 10);

async function start() {
  const [{ default: app }, { connectDb }, { createAdminIfNotExists }] = await Promise.all([
    import("./app.js"),
    import("./config/db.js"),
    import("./services/auth.service.js"),
  ]);

  const mongoUri = process.env.MONGO_URI;
  await connectDb(mongoUri);

  // Seed initial admin user (optional)
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    await createAdminIfNotExists({ email: adminEmail, password: adminPassword });
    console.info("✅ Admin user ensured (check ADMIN_EMAIL / ADMIN_PASSWORD)");
  }

  app.listen(PORT, () => {
    console.info(`🚀 Server listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
