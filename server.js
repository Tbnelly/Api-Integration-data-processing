import express from "express";
import serverless from "serverless-http";

const app = express();

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

function sendError(res, statusCode, message) {
  return res.status(statusCode).json({
    status: "error",
    message,
  });
}

app.get("/api/classify", async (req, res) => {
  let { name } = req.query;

  if (Array.isArray(name)) {
    name = name[0];
  }

  if (!name || typeof name !== "string" || name.trim() === "") {
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

  if (!genderizeData.gender || genderizeData.count === 0) {
    return sendError(res, 422, "No prediction available for the provided name");
  }

  const probability = Number(genderizeData.probability);
  const sample_size = Number(genderizeData.count);

  const is_confident = probability >= 0.7 && sample_size >= 100;

  return res.status(200).json({
    status: "success",
    data: {
      name: genderizeData.name,
      gender: genderizeData.gender,
      probability,
      sample_size,
      is_confident,
      processed_at: new Date().toISOString(),
    },
  });
});

export default serverless(app);