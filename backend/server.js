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

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
    relevel: { type: Number, default: 0 },
  },
  bookings: [
    {
      date: String,
      timeSlot: String,
      dutyType: String,
      year: Number, // Add year field
    },
  ],
});

const AvailableDateSchema = new mongoose.Schema({
  date: { type: String, required: true },
  year: { type: Number, required: true },
});

const Faculty = mongoose.model("Faculty", FacultySchema);
const AvailableDate = mongoose.model("AvailableDate", AvailableDateSchema);

// ✅ Multer for Image Upload
const storage = multer.diskStorage({
  destination: path.join(__dirname, "uploads"),
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
      duties: { exam: 0, bundle: 0, relevel: 0 },
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

// ✅ Admin Login API
app.post("/admin/login", async (req, res) => {
  try {
    const { adminId, password, secretKey } = req.body;

    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(400).json({ message: "Invalid Secret Key!" });
    }

    const faculty = await Faculty.findOne({ facultyId: adminId });

    if (!faculty) {
      return res.status(400).json({ message: "Invalid Admin ID or Password!" });
    }

    const isPasswordValid = await bcrypt.compare(password, faculty.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid Admin ID or Password!" });
    }

    const token = jwt.sign({ facultyId: faculty.facultyId }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      message: "Admin Login Successful!",
      token,
      faculty,
    });
  } catch (error) {
    console.error("❌ Admin Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Fetch Admin Dashboard Data
app.get("/admin/dashboard", authenticate, async (req, res) => {
  try {
    const facultyData = await Faculty.find().select("-password");

    const totalFaculties = facultyData.length;
    const associateProfessors = facultyData.filter(faculty => faculty.designation === "Associate Professor").length;
    const assistantProfessors = facultyData.filter(faculty => faculty.designation === "Assistant Professor").length;
    const nonTeachingStaff = facultyData.filter(faculty => faculty.designation === "Non-Teaching Staff").length;
    const hod = facultyData.filter(faculty => faculty.designation === "HOD").length;

    const branchDistribution = facultyData.reduce((acc, faculty) => {
      acc[faculty.branch] = (acc[faculty.branch] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalFaculties,
      associateProfessors,
      assistantProfessors,
      nonTeachingStaff,
      hod,
      branchDistribution,
    });
  } catch (error) {
    console.error("❌ Error Fetching Admin Dashboard Data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Fetch Faculty List
app.get("/admin/faculty-list", authenticate, async (req, res) => {
  try {
    const { branch, page = 1 } = req.query;
    const itemsPerPage = 10;

    const query = branch ? { branch } : {};
    const facultyData = await Faculty.find(query).select("-password").skip((page - 1) * itemsPerPage).limit(itemsPerPage);

    res.json({ faculties: facultyData });
  } catch (error) {
    console.error("❌ Error Fetching Faculty List:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Fetch Admin Profile
app.get("/admin/profile", authenticate, async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ facultyId: req.facultyId }).select("-password");
    if (!faculty) return res.status(404).json({ message: "Admin not found!" });

    res.json(faculty);
  } catch (error) {
    console.error("❌ Error Fetching Admin Profile:", error);
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
    const { facultyId, date, timeSlot, dutyType, year } = req.body;

    if (!facultyId || !date || !timeSlot || !dutyType || !year) {
      return res.status(400).json({ message: "❌ Missing required fields!" });
    }

    const faculty = await Faculty.findOne({ facultyId });
    if (!faculty) return res.status(404).json({ message: "❌ Faculty not found!" });

    if (faculty.bookings.some((booking) => booking.date === date && booking.timeSlot === timeSlot)) {
      return res.status(400).json({ message: "❌ You have already booked a duty for this slot!" });
    }

    if (!faculty.duties) {
      faculty.duties = { exam: 0, bundle: 0, relevel: 0 };
    }

    const dutyKey = dutyType.toLowerCase();
    faculty.duties[dutyKey] = (faculty.duties[dutyKey] || 0) + 1;

    faculty.bookings.push({ date, timeSlot, dutyType, year });
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

// ✅ Add Date API
app.post("/admin/add-date", authenticate, async (req, res) => {
  try {
    const { date, year } = req.body;

    if (!date || !year) {
      return res.status(400).json({ message: "❌ Missing required fields!" });
    }

    const newDate = new AvailableDate({ date, year });
    await newDate.save();

    res.status(200).json({ message: "✅ Date added successfully!" });
  } catch (error) {
    console.error("❌ Error adding date:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Reset Dates API
app.post("/admin/reset-dates", authenticate, async (req, res) => {
  try {
    // Remove all available dates
    await AvailableDate.deleteMany({});

    // Remove all bookings from faculty
    await Faculty.updateMany({}, { $set: { bookings: [] } });

    res.status(200).json({ message: "✅ Dates reset successfully!" });
  } catch (error) {
    console.error("❌ Error resetting dates:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Fetch Available Dates
app.get("/admin/available-dates", authenticate, async (req, res) => {
  try {
    const dates = await AvailableDate.find();
    res.json(dates);
  } catch (error) {
    console.error("❌ Error fetching available dates:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Fetch Date History
app.get("/admin/date-history", authenticate, async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ facultyId: req.facultyId }).select("bookings");
    if (!faculty) return res.status(404).json({ message: "Faculty not found!" });

    res.json(faculty.bookings);
  } catch (error) {
    console.error("❌ Error Fetching Date History:", error);
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
