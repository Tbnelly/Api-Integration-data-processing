import express from "express";

const app = express();


app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// ── Helper: send error responses ────────────────────────────
function sendError(res, statusCode, message) {
  return res.status(statusCode).json({
    status: "error",
    message,
  });
}

// ── Main route ───────────────────────────────────────────────
app.get("/api/classify", async (req, res) => {
  const { name } = req.query;

  // Check for array (e.g. ?name=a&name=b) BEFORE the empty check
  if (Array.isArray(name)) {
    return sendError(res, 400, "Name must be a string, not an array or object");
  }

  if (!name || name.trim() === "") {
    return sendError(res, 400, "Name query parameter is required");
  }

  let genderizeData;
  try {
    const response = await fetch(
      `https://api.genderize.io?name=${encodeURIComponent(name.trim())}`
    );

    if (!response.ok) {
      return sendError(res, 502, "External API returned an unexpected error");
    }

    genderizeData = await response.json();
  } catch (err) {
    return sendError(res, 500, "Failed to reach the external classification API");
  }

  // ── No prediction available ──────────────────────────────
  if (genderizeData.gender === null || genderizeData.count === 0) {
    return sendError(res, 404, "No prediction available for the provided name");
  }

  const probability  = genderizeData.probability;
  const sample_size  = genderizeData.count;
  const is_confident = probability >= 0.7 && sample_size >= 100;

  return res.status(200).json({
    status: "success",
    data: {
      name:         genderizeData.name,
      gender:       genderizeData.gender,
      probability,
      sample_size,
      is_confident,
      processed_at: new Date().toISOString(),
    },
  });
});

// ── Local dev: listen normally; Vercel: export the app ───────
if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => console.log("Server running on http://localhost:3000"));
}

export default app;