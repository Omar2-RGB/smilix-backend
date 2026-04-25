const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

// GET latest pending website appointment
router.get("/latest/pending", async (req, res) => {
  try {
    const latest = await prisma.appointment.findFirst({
      where: {
        status: "pending",
        source: "website"
      },
      include: {
        patient: true
      },
      orderBy: {
        id: "desc"
      }
    });

    res.json(latest || null);
  } catch (error) {
    console.error("Get latest pending appointment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET all appointments
router.get("/", async (req, res) => {
  try {
    const { search = "", date = "", status = "" } = req.query;

    const where = {};

    if (search) {
      where.patient = {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { patientCode: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      where.appointmentDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (status) {
      where.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
      },
      orderBy: [
        { appointmentDate: "desc" },
        { appointmentTime: "asc" },
      ],
    });

    res.json(appointments);
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET one appointment
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(appointment);
  } catch (error) {
    console.error("Get appointment by id error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// CREATE appointment
router.post("/", async (req, res) => {
  try {
    const {
      patientId,
      appointmentDate,
      appointmentTime,
      status,
      source,
      notes,
    } = req.body;

    if (!patientId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        message: "المريض والتاريخ والوقت مطلوبة",
      });
    }

    const created = await prisma.appointment.create({
      data: {
        patientId: Number(patientId),
        appointmentDate: new Date(appointmentDate),
        appointmentTime: new Date(`1970-01-01T${appointmentTime}:00`),
        status: status || "pending",
        source: source || "manual",
        notes: notes || null,
        createdBy: 1,
      },
      include: {
        patient: true,
      },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error("Create appointment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// UPDATE appointment
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      patientId,
      appointmentDate,
      appointmentTime,
      status,
      source,
      notes,
    } = req.body;

    const existing = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        patientId: Number(patientId),
        appointmentDate: new Date(appointmentDate),
        appointmentTime: new Date(`1970-01-01T${appointmentTime}:00`),
        status: status || "pending",
        source: source || "manual",
        notes: notes || null,
      },
      include: {
        patient: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// CONFIRM appointment
router.put("/:id/confirm", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: "confirmed"
      },
      include: {
        patient: true
      }
    });

    res.json(updated);
  } catch (error) {
    console.error("Confirm appointment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE appointment
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    await prisma.appointment.delete({
      where: { id },
    });

    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Delete appointment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;