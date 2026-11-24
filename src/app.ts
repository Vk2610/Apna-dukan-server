
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import shopRoutes from "./routes/shop.routes.js";

const app = express();

// Security middleware (allow inline scripts for web deep-link bridge)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Cross-origin resource sharing
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Apple App Site Association for iOS Universal Links
app.get("/.well-known/apple-app-site-association", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    applinks: {
      apps: [],
      details: [
        {
          appID: "TEAMID.com.apnadukan.app",
          paths: ["/auth/*", "/email-verified*"]
        }
      ]
    }
  });
});

// Digital Asset Links for Android App Links
app.get("/.well-known/assetlinks.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.apnadukan.app",
        sha256_cert_fingerprints: [
          "14:6D:E9:7C:0F:CD:CF:70:4E:86:11:6D:99:99:99:99:99:99:99:99:99:99:99:99:99:99:99:99:99:99:99:99"
        ]
      }
    }
  ]);
});

// Basic test route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to ApnaDukan API"
  });
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ApnaDukan backend is running",
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.use("/api/auth", authRoutes);

// Authenticated shop profile routes
app.use("/api/shops", shopRoutes);

export default app;
