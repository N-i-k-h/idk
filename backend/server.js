import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ✅ JWT Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.facultyId = decoded.facultyId;
    next();
  } catch (error) {
    console.error("❌ Token Verification Error:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// ✅ Faculty Schema
const FacultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  facultyId: { type: String, unique: true, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  designation: { type: String, required: true },
  branch: { type: String, required: true },
  password: { type: String, required: true },
  imageUrl: String,
  duties: {
    exam: { type: Number, default: 0 },
    bundle: { type: Number, default: 0 },
    renewal: { type: Number, default: 0 },
  },
  bookings: [
    {
      date: String,
      timeSlot: String,
      dutyType: String,
    },
  ],
});

const Faculty = mongoose.model("Faculty", FacultySchema);

// ✅ Multer for Image Upload
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error("Incorrect file type");
    error.status = 400;
    return cb(error, false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

// ✅ Faculty Registration API
app.post("/register", upload.single("image"), async (req, res) => {
  try {
    const { name, facultyId, email, phone, designation, branch, password, confirmPassword } = req.body;

    if (!name || !facultyId || !email || !phone || !password || !confirmPassword || !designation || !branch) {
      return res.status(400).json({ message: "❌ All fields are required!" });
    }

    if (password.trim() !== confirmPassword.trim()) {
      return res.status(400).json({ message: "❌ Passwords do not match!" });
    }

    if (await Faculty.findOne({ email })) {
      return res.status(400).json({ message: "❌ Email already exists!" });
    }
    if (await Faculty.findOne({ facultyId })) {
      return res.status(400).json({ message: "❌ Faculty ID already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const faculty = new Faculty({
      name,
      facultyId,
      email,
      phone,
      designation,
      branch,
      password: hashedPassword,
      imageUrl,
      duties: { exam: 0, bundle: 0, renewal: 0 },
      bookings: [],
    });

    await faculty.save();
    res.status(201).json({ message: "✅ Registration Successful!", imageUrl });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Login API
app.post("/login", async (req, res) => {
  try {
    const { facultyId, password } = req.body;
    const faculty = await Faculty.findOne({ facultyId });

    if (!faculty) return res.status(400).json({ message: "Invalid Faculty ID or Password!" });

    if (!(await bcrypt.compare(password, faculty.password))) {
      return res.status(400).json({ message: "Invalid Faculty ID or Password!" });
    }

    const token = jwt.sign({ facultyId: faculty.facultyId }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      message: "Login Successful!",
      token,
      faculty,
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Fetch Faculty Profile
app.get("/faculty-profile/:facultyId", async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ facultyId: req.params.facultyId }).select("-password");
    if (!faculty) return res.status(404).json({ message: "Faculty not found!" });

    res.json(faculty);
  } catch (error) {
    console.error("❌ Error Fetching Faculty Profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Booking API
app.post("/book-room", async (req, res) => {
  try {
    const { facultyId, date, timeSlot, dutyType } = req.body;

    if (!facultyId || !date || !timeSlot || !dutyType) {
      return res.status(400).json({ message: "❌ Missing required fields!" });
    }

    const faculty = await Faculty.findOne({ facultyId });
    if (!faculty) return res.status(404).json({ message: "❌ Faculty not found!" });

    if (faculty.bookings.some((booking) => booking.date === date && booking.timeSlot === timeSlot)) {
      return res.status(400).json({ message: "❌ You have already booked a duty for this slot!" });
    }

    if (!faculty.duties) {
      faculty.duties = { exam: 0, bundle: 0, renewal: 0 };
    }

    const dutyKey = dutyType.toLowerCase();
    faculty.duties[dutyKey] = (faculty.duties[dutyKey] || 0) + 1;

    faculty.bookings.push({ date, timeSlot, dutyType });
    await faculty.save();

    res.status(200).json({
      message: "✅ Booking successful!",
      duties: faculty.duties,
      bookings: faculty.bookings,
    });
  } catch (error) {
    console.error("❌ Booking Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Profile Update API
app.put("/update-profile", authenticate, upload.single("image"), async (req, res) => {
  try {
    const { name, email, phone, designation, branch } = req.body;
    const faculty = await Faculty.findOne({ facultyId: req.facultyId });

    if (!faculty) return res.status(404).json({ message: "Faculty not found!" });

    if (!name || !email || !phone || !designation || !branch) {
      return res.status(400).json({ message: "❌ All fields are required!" });
    }

    if (email !== faculty.email) {
      const existingEmail = await Faculty.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "❌ Email already exists!" });
      }
    }

    const updates = {
      name,
      email,
      phone,
      designation,
      branch,
    };

    if (req.file) {
      if (faculty.imageUrl) {
        const oldImagePath = path.join(__dirname, "uploads", path.basename(faculty.imageUrl));
        try {
          fs.unlinkSync(oldImagePath);
        } catch (unlinkError) {
          console.error("❌ Error deleting old image:", unlinkError);
          return res.status(500).json({ message: "Error deleting old image" });
        }
      }
      updates.imageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedFaculty = await Faculty.findOneAndUpdate(
      { facultyId: req.facultyId },
      updates,
      { new: true }
    ).select("-password");

    res.status(200).json({
      message: "✅ Profile updated successfully!",
      faculty: updatedFaculty,
    });
  } catch (error) {
    console.error("❌ Profile Update Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
 