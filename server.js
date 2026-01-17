// proxy.js
import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const TARGET = process.env["CANVAS_TARGET"];

if (!TARGET) {
  throw new Error("CANVAS_TARGET env variable must be provided");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files for non-/api requests
app.use(express.static(path.join(__dirname, "dist")));

// Add middleware to handle preflight OPTIONS requests
app.use("/api", async (req, res, next) => {
  // Set permissive CORS headers for all requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, Accept" // explicitly include Authorization
  );

  if (req.method === "OPTIONS") {
    // Respond immediately to preflight
    return res.sendStatus(204);
  }

  next();
});

// CORS proxy only for /api/*
app.use("/api", async (req, res) => {
  const url = TARGET + req.originalUrl;
  let origin = req.headers.origin;
  if (!origin && req.headers.host) {
    origin = `${req.protocol ?? "http"}://${req.headers.host}`;
  }

  const upstream = await fetch(url, {
    method: req.method,
    headers: {
      ...req.headers,
      host: new URL(TARGET).host,
    },
    body: ["GET", "HEAD"].includes(req.method) ? undefined : req,
  });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  res.status(upstream.status);

  // Rewrite Link headers dynamically based on TARGET
  const linkHeader = upstream.headers.get("Link");
  if (linkHeader) {
    // Escape special regex characters in TARGET
    const escapedTarget = TARGET.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`<${escapedTarget}([^>]+)>`, "g");

    const rewritten = linkHeader.replace(regex, `<${origin}$1>`);
    res.setHeader("Link", rewritten);
    res.setHeader("Access-Control-Expose-Headers", "Link");
  }

  // Pass through other headers
  upstream.headers.forEach((v, k) => {
    if (k.toLowerCase() !== "content-encoding" && k.toLowerCase() !== "link") {
      res.setHeader(k, v);
    }
  });

  upstream.body.pipe(res);
});

const server = app.listen(3000, "0.0.0.0", () => {
  console.log("Listening");
});

process.on("SIGINT", () => {
  console.log("Caught SIGINT. Shutting down...");

  // Close server gracefully
  server.close(() => {
    console.log("Server closed");
    process.exit(0); // exit with success
  });

  // Force exit if not closed after some timeout
  setTimeout(() => {
    console.error("Could not close connections in time, forcing exit");
    process.exit(1);
  }, 5000);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM");
  server.close(() => process.exit(0));
});