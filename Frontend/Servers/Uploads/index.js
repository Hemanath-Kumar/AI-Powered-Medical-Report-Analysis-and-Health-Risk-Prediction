import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Fix __dirname and __filename for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-here";

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ensure uploads directory exists
if (!fs.existsSync(path.join(__dirname, "uploads"))) {
  fs.mkdirSync(path.join(__dirname, "uploads"));
}

// Mock database (in production, use a real database)
let users = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    email: "sarah@healthai.com",
    password:
      "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
    role: "doctor",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Jane Patient",
    email: "jane@example.com",
    password:
      "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
    role: "patient",
    created_at: new Date().toISOString(),
  },
];

let reports = [];
let analysisResults = [];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname +
        "-" +
        uniqueSuffix +
        path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF, JPG, JPEG, and PNG files are allowed"));
    }
  },
});

// Mock AI functions
const mockAIAnalysis = (reportType, fileName) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (reportType === "blood_test") {
        resolve({
          metrics_json: {
            cholesterol: Math.floor(Math.random() * 50) + 150,
            sugar: Math.floor(Math.random() * 40) + 80,
            hemoglobin: (Math.random() * 4 + 12).toFixed(1),
            blood_pressure: `${
              Math.floor(Math.random() * 20) + 110
            }/${Math.floor(Math.random() * 15) + 70}`,
          },
          ai_summary: `Analysis of ${fileName} shows blood test results within normal ranges.`,
          disease_prediction: null,
        });
      } else if (reportType === "mammogram") {
        const isNormal = Math.random() > 0.3;
        resolve({
          metrics_json: {},
          ai_summary: isNormal
            ? `Mammogram analysis of ${fileName} shows no abnormalities.`
            : `Mammogram analysis of ${fileName} detected a suspicious area.`,
          disease_prediction: isNormal
            ? null
            : {
                condition: "Suspicious mass detected",
                confidence: Math.floor(Math.random() * 30) + 70,
                recommendations: [
                  "Consult with oncologist immediately",
                  "Schedule additional imaging (MRI)",
                  "Consider biopsy",
                  "Follow up in 2 weeks",
                ],
              },
        });
      } else {
        resolve({
          metrics_json: {},
          ai_summary: `Analysis of ${fileName} completed.`,
          disease_prediction: null,
        });
      }
    }, 2000);
  });
};

// Routes

// Auth routes
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: String(users.length + 1),
      name,
      email,
      password: hashedPassword,
      role: "patient",
      created_at: new Date().toISOString(),
    };

    users.push(newUser);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    const { password: _, ...userResponse } = newUser;

    res.status(201).json({
      message: "User created successfully",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    const { password: _, ...userResponse } = user;

    res.json({
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Report routes
app.post(
  "/api/reports/upload",
  authenticateToken,
  upload.array("files"),
  async (req, res) => {
    try {
      const { reportType = "other" } = req.body;
      const uploadedReports = [];

      for (const file of req.files) {
        const newReport = {
          id: String(reports.length + 1),
          user_id: req.user.id,
          file_path: file.path,
          report_type: reportType,
          upload_date: new Date().toISOString(),
          file_name: file.originalname,
          file_size: file.size,
        };

        reports.push(newReport);
        uploadedReports.push(newReport);

        const analysisResult = await mockAIAnalysis(
          reportType,
          file.originalname
        );
        const newAnalysis = {
          id: String(analysisResults.length + 1),
          report_id: newReport.id,
          ...analysisResult,
          created_at: new Date().toISOString(),
        };
        analysisResults.push(newAnalysis);
      }

      res.json({
        message: "Files uploaded successfully",
        reports: uploadedReports,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

app.get("/api/reports", authenticateToken, (req, res) => {
  const userReports = reports.filter((r) => r.user_id === req.user.id);
  res.json(userReports);
});

app.post("/api/reports/analyze", authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.body;

    const report = reports.find(
      (r) => r.id === reportId && r.user_id === req.user.id
    );
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    let analysis = analysisResults.find((a) => a.report_id === reportId);

    if (!analysis) {
      const analysisResult = await mockAIAnalysis(
        report.report_type,
        report.file_name
      );
      analysis = {
        id: String(analysisResults.length + 1),
        report_id: reportId,
        ...analysisResult,
        created_at: new Date().toISOString(),
      };
      analysisResults.push(analysis);
    }

    res.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ message: "Analysis failed" });
  }
});

app.post("/api/reports/detect", authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.body;

    const report = reports.find(
      (r) => r.id === reportId && r.user_id === req.user.id
    );
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.report_type !== "mammogram") {
      return res
        .status(400)
        .json({ message: "Detection is only available for mammogram reports" });
    }

    let analysis = analysisResults.find((a) => a.report_id === reportId);

    if (!analysis) {
      const analysisResult = await mockAIAnalysis(
        "mammogram",
        report.file_name
      );
      analysis = {
        id: String(analysisResults.length + 1),
        report_id: reportId,
        ...analysisResult,
        created_at: new Date().toISOString(),
      };
      analysisResults.push(analysis);
    }

    res.json(analysis);
  } catch (error) {
    console.error("Detection error:", error);
    res.status(500).json({ message: "Detection failed" });
  }
});

// User routes
app.get("/api/users/profile", authenticateToken, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { password: _, ...userProfile } = user;
  res.json(userProfile);
});

app.put("/api/users/profile", authenticateToken, (req, res) => {
  const userIndex = users.findIndex((u) => u.id === req.user.id);
  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  const { name, email } = req.body;
  users[userIndex] = {
    ...users[userIndex],
    name: name || users[userIndex].name,
    email: email || users[userIndex].email,
  };

  const { password: _, ...userProfile } = users[userIndex];
  res.json(userProfile);
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "HealthAI API is running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Health check: http://localhost:${PORT}/api/health`);
  console.log("Test accounts:");
  console.log("- sarah@healthai.com (doctor) / password");
  console.log("- jane@example.com (patient) / password");
});
