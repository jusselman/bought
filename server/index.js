import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import MongoStore from "connect-mongo";
import rateLimit from "express-rate-limit";

// Import routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import brandRoutes from "./routes/brands.js";
import releaseRoutes from "./routes/releases.js";
import postRoutes from "./routes/posts.js";
import notificationRoutes from "./routes/notifications.js";
import brandUpdatesRoutes from "./routes/brandUpdatesRoutes.js"; 

// Import middleware
import { verifyToken } from "./middleware/auth.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

// Import controllers for file uploads
import { register } from "./controllers/auth.js";
import { createRelease } from "./controllers/releases.js";
import { createPost } from "./controllers/posts.js";

// Import RSS cron jobs
import rssCronJobs from "./jobs/rssCronJobs.js"; // ← NEW

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

// CORS configuration for React Native
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// Static files
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use("/api/", limiter);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

/* FILE STORAGE */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

/* ROUTES WITH FILES */
app.post("/auth/register", upload.single("picture"), register);
app.post("/releases", verifyToken, upload.single("picture"), createRelease);
app.post("/posts", verifyToken, upload.single("picture"), createPost);

/* API ROUTES */
// Health check
app.get("/", (req, res) => {
  res.json({ 
    message: "Bought API Server", 
    status: "running",
    timestamp: new Date().toISOString()
  });
});

// Mount route files
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/brands", brandRoutes);
app.use("/releases", releaseRoutes);
app.use("/posts", postRoutes);
app.use("/notifications", notificationRoutes);
app.use("/updates", brandUpdatesRoutes); // ← NEW (no /api prefix - already in limiter)

/* ERROR HANDLING */
// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 6001;
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
    console.log("✅ MongoDB connected successfully");
    
    // ← NEW: Start RSS cron jobs after successful DB connection
    rssCronJobs.start();
  })
  .catch((error) => console.log(`❌ ${error} - MongoDB did not connect`));

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  process.exit(1);
});

// ← NEW: Graceful shutdown - stop cron jobs
process.on("SIGTERM", () => {
  console.log("📴 SIGTERM received, shutting down gracefully");
  rssCronJobs.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("📴 SIGINT received, shutting down gracefully");
  rssCronJobs.stop();
  process.exit(0);
});