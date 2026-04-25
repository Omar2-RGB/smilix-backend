const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

// GET all treatment types for dropdown
router.get("/types", async (req, res) => {
  try {
    const types = await prisma.treatmentType.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    res.json(types);
  } catch (error) {
    console.error("Get treatment types error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET treatments for one patient
router.get("/patient/:patientId", async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);

    const treatments = await prisma.treatmentSession.findMany({
      where: { patientId },
      include: {
        treatmentType: true,
        createdByUser: true,
      },
      orderBy: {
        sessionDate: "desc",
      },
    });

    res.json(treatments);
  } catch (error) {
    console.error("Get patient treatments error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// CREATE treatment for patient
router.post("/", async (req, res) => {
  try {
    const {
      patientId,
      treatmentTypeId,
      toothNumber,
      price,
      status,
      notes,
      sessionDate,
    } = req.body;

    if (!patientId || !treatmentTypeId || !sessionDate) {
      return res.status(400).json({ message: "الحقول الأساسية مطلوبة" });
    }

    const created = await prisma.treatmentSession.create({
      data: {
        patientId: Number(patientId),
        treatmentTypeId: Number(treatmentTypeId),
        toothNumber: toothNumber ? String(toothNumber) : null,
        price: Number(price || 0),
        status: status || "planned",
        notes: notes || null,
        sessionDate: new Date(sessionDate),
        createdBy: 1,
      },
      include: {
        treatmentType: true,
      },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error("Create treatment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// UPDATE treatment
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      treatmentTypeId,
      toothNumber,
      price,
      status,
      notes,
      sessionDate,
    } = req.body;

    const existing = await prisma.treatmentSession.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Treatment not found" });
    }

    const updated = await prisma.treatmentSession.update({
      where: { id },
      data: {
        treatmentTypeId: Number(treatmentTypeId),
        toothNumber: toothNumber ? String(toothNumber) : null,
        price: Number(price || 0),
        status: status || "planned",
        notes: notes || null,
        sessionDate: new Date(sessionDate),
      },
      include: {
        treatmentType: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Update treatment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE treatment
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.treatmentSession.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Treatment not found" });
    }

    await prisma.treatmentSession.delete({
      where: { id },
    });

    res.json({ message: "Treatment deleted successfully" });
  } catch (error) {
    console.error("Delete treatment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;