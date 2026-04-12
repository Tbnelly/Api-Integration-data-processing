import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// ── CORS middleware ──────────────────────────────────────────
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

  // 1. Missing or empty name → 400
  if (!name || name.trim() === "") {
    return sendError(res, 400, "Name query parameter is required");
  }

  // 2. name must be a string (it always is from query params,
  //    but we guard against things like ?name[]=john which Express
  //    parses as an array)
  if (typeof name !== "string") {
    return sendError(res, 422, "Name must be a string, not an array or object");
  }

  // 3. Call the external Genderize API
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
    // Network failure, DNS error, timeout, etc.
    return sendError(res, 500, "Failed to reach the external classification API");
  }

  // 4. Handle no-prediction cases
  if (genderizeData.gender === null || genderizeData.count === 0) {
    return sendError(res, 200, "No prediction available for the provided name");
  }

  // 5. Build the structured response
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

// ── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});