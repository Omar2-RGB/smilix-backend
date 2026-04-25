const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const patientsCount = await prisma.patient.count();
    const appointmentsCount = await prisma.appointment.count();
    const invoicesCount = await prisma.invoice.count();

    const latestPatients = await prisma.patient.findMany({
      orderBy: { createdAt: "desc" },
      take: 5
    });

    const latestAppointments = await prisma.appointment.findMany({
      orderBy: [
        { appointmentDate: "desc" },
        { appointmentTime: "desc" }
      ],
      take: 5,
      include: {
        patient: true
      }
    });

    res.json({
      patientsCount,
      appointmentsCount,
      invoicesCount,
      latestPatients,
      latestAppointments
    });
  } catch (error) {
    console.error("Dashboard route error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;