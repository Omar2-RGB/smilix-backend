const express = require("express");
const cors = require("cors");
const path = require("path");

// عرض ملفات الموقع
app.use(express.static(path.join(__dirname, "../renderer")));
const authRoutes = require("./routes/auth.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const patientsRoutes = require("./routes/patients.routes");
const patientFilesRoutes = require("./routes/patientFiles.routes");
const treatmentTypesRoutes= require("./routes/treatmentTypes.routes");
const treatmentsRoutes= require("./routes/treatments.routes");
const appointmentsRoutes= require("./routes/appointments.routes");
const invoicesRoutes = require("./routes/invoices.routes");
const paymentsRoutes = require("./routes/payments.routes");
const usersRoutes = require("./routes/users.routes");
const rolesRoutes = require("./routes/roles.routes");
const dashboardAlertsRoutes = require("./routes/dashboardAlerts.routes");
const slotsRoutes = require("./routes/slots.routes");
const publicBookingRoutes = require("./routes/publicBooking.routes");
const labOrdersRoutes = require("./routes/labOrders");
const expensesRoutes = require("./routes/expenses");
const suppliersRoutes = require("./routes/suppliers.routes");const app = express();
const supplierPurchasesRoutes = require("./routes/supplier-purchases.routes");
const reviewsRoutes = require("./routes/reviews.routes");
const backupRoutes = require("./routes/backup.routes");
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Smilix API is running 🚀" });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/patient-files", patientFilesRoutes);
app.use("/api/treatment-types", treatmentTypesRoutes);
app.use("/api/treatments", treatmentsRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/dashboard-alerts", dashboardAlertsRoutes);
app.use("/api/slots", slotsRoutes);
app.use("/api/public", publicBookingRoutes);
app.use("/api/lab-orders", labOrdersRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/suppliers", suppliersRoutes);
app.use("/api/supplier-purchases", supplierPurchasesRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api", backupRoutes);
app.get("/booking", (req, res) => {
  res.sendFile(path.join(__dirname, "../renderer/booking.html"));
});
module.exports = app; 