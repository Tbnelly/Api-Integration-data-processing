# Gender Classify API

A lightweight REST API built with Node.js and Express that classifies a name's likely gender using the [Genderize.io](https://genderize.io) API. Returns structured JSON with a confidence flag based on probability and sample size.

## Endpoint
GET /api/classify?name={name}

### Success Response

```json
{
  "status": "success",
  "data": {
    "name": "john",
    "gender": "male",
    "probability": 0.99,
    "sample_size": 1234,
    "is_confident": true,
    "processed_at": "2026-04-12T10:30:00.000Z"
  }
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Name query parameter is required"
}
```

## Tech Stack

- Node.js v18+
- Express v4
- Native `fetch` (no axios needed — built into Node 18+)

## Project Structure
classify-api/
├── server.js        # All application logic
├── package.json     # Project config and dependencies
└── README.md

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/classify-api.git
cd classify-api

# Install dependencies
npm install

# Start the development server (auto-restarts on file changes)
npm run dev

# Or start normally
npm start
```

The server will run at `http://localhost:3000`

## API Reference

### `GET /api/classify`

Classifies a name by likely gender.

#### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | The first name to classify |

#### `is_confident` Logic
is_confident = true  →  probability >= 0.7  AND  sample_size >= 100
is_confident = false →  anything else

#### Error Codes

| Status | Cause |
|---|---|
| `400` | `name` parameter is missing or empty |
| `422` | `name` is not a string (e.g. array: `?name[]=john`) |
| `500` | Could not reach the Genderize.io API |
| `502` | Genderize.io returned an unexpected error |

#### No Prediction Case

When Genderize has no data for a name (rare names, fictional names, etc.):

```json
{
  "status": "error",
  "message": "No prediction available for the provided name"
}
```

## Testing

### Browser
Open directly in your browser:
http://localhost:3000/api/classify?name=john

### curl

```bash
# Normal request
curl "http://localhost:3000/api/classify?name=john"

# Missing name → 400
curl "http://localhost:3000/api/classify"

# Empty name → 400
curl "http://localhost:3000/api/classify?name="

# Rare name with no data
curl "http://localhost:3000/api/classify?name=xqzptw"

# Array param → 422
curl "http://localhost:3000/api/classify?name[]=john"
```

### Postman

1. Open Postman → click **New Request**
2. Set method to `GET`
3. Enter URL: `http://localhost:3000/api/classify`
4. Go to the **Params** tab
5. Add key: `name`, value: `john`
6. Click **Send**

## CORS

All responses include:
Access-Control-Allow-Origin: *

This allows any frontend application (running on any domain) to call this API directly from the browser.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |

On Railway and Vercel, `PORT` is set automatically — you don't need to configure it manually.

## Deployment

### Railway (recommended for beginners)

1. Push your code to a GitHub repository
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Select your repository
4. Railway auto-detects Node.js and runs `npm start`
5. Click **Generate Domain** to get a public URL

Your live endpoint will be:
https://api-integration-data-processing-two.vercel.app/api/classify?name=john
### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from your project folder
vercel

# Follow the prompts — it deploys automatically
```

> **Note:** Vercel uses serverless functions. The server does not stay running between requests — each request cold-starts a function. This is fine for this API but worth knowing.

## Example Responses

### High-confidence prediction
```bash
curl "http://localhost:3000/api/classify?name=james"
```
```json
{
  "status": "success",
  "data": {
    "name": "james",
    "gender": "male",
    "probability": 0.97,
    "sample_size": 4032,
    "is_confident": true,
    "processed_at": "2026-04-12T10:45:00.000Z"
  }
}
```

### Low-confidence prediction
```bash
curl "http://localhost:3000/api/classify?name=riley"
```
```json
{
  "status": "success",
  "data": {
    "name": "riley",
    "gender": "male",
    "probability": 0.55,
    "sample_size": 312,
    "is_confident": false,
    "processed_at": "2026-04-12T10:45:01.000Z"
  }
}
```

### No data available
```bash
curl "http://localhost:3000/api/classify?name=xqzptw"
```
```json
{
  "status": "error",
  "message": "No prediction available for the provided name"
}
```