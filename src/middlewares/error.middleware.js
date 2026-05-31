export function errorHandler(err, req, res, next) {
  console.error(err);

  let status = err.status || 500;
  let message = err.message || "Internal Server Error";

  // Handle duplicate key errors (e.g. unique slug, unique email)
  // Mongo / Mongoose uses code 11000 for duplicate key
  if (err && (err.code === 11000 || err?.errorResponse?.code === 11000)) {
    status = 409;

    const fields = err.keyValue ? Object.keys(err.keyValue) : [];

    if (fields.includes("slug")) {
      message = "Course slug already exists";
    } else if (fields.includes("email")) {
      message = "Email already in use";
    } else {
      message = "Duplicate key error";
    }
  }

  res.status(status).json({
    ok: false,
    message,
    errors: err.errors ?? undefined,
  });
}
