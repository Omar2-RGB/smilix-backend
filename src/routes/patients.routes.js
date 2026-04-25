const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

// GET all patients
router.get("/", async (req, res) => {
  try {
    const search = req.query.search;

    const patients = await prisma.patient.findMany({
      where: search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          }
        : {},
      orderBy: { createdAt: "desc" },
    });

    res.json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE patient
router.post("/", async (req, res) => {
  try {
    const { fullName, phone, gender, birthDate, address, notes } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: "الاسم الكامل مطلوب" });
    }

    const patientCode = `PT-${Date.now().toString().slice(-6)}`;

    const patient = await prisma.patient.create({
      data: {
        patientCode,
        fullName: fullName.trim(),
        phone: phone || null,
        gender: gender || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        address: address || null,
        notes: notes || null,
      },
    });

    res.status(201).json(patient);
  } catch (err) {
    console.error("Create patient error:", err);
    res.status(500).json({ message: "Create failed" });
  }
});

// UPDATE patient
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { fullName, phone, gender, birthDate, address, notes } = req.body;

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        fullName: fullName?.trim() || null,
        phone: phone || null,
        gender: gender || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        address: address || null,
        notes: notes || null,
      },
    });

    res.json(patient);
  } catch (err) {
    console.error("Update patient error:", err);
    res.status(500).json({ message: "Update failed" });
  }
});
// GET single patient
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const patient = await prisma.patient.findUnique({
      where: { id }
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json(patient);
  } catch (error) {
    console.error("Get patient error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// DELETE patient
router.delete("/:id", async (req, res) => {
  try {
    await prisma.patient.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;