require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = require("./app");

const PORT = process.env.PORT || 5000;

// ✅ مهم جداً
app.use(cors());
app.use(express.json());

// routes
const dashboardRoutes = require("./routes/dashboard.routes");
app.use("/api/dashboard", dashboardRoutes);

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});