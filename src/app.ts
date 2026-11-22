
import express from "express";
import cors from "cors";
import helmet from "helmet";

const app = express();

// Security middleware
app.use(helmet());

// Cross-origin resource sharing
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

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

export default app;
