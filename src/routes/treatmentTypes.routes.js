const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

// GET all treatment types
router.get("/", async (req, res) => {
  try {
    const treatmentTypes = await prisma.treatmentType.findMany({
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    res.json(treatmentTypes);
  } catch (error) {
    console.error("Get treatment types error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET one treatment type
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const treatmentType = await prisma.treatmentType.findUnique({
      where: { id },
    });

    if (!treatmentType) {
      return res.status(404).json({ message: "Treatment type not found" });
    }

    res.json(treatmentType);
  } catch (error) {
    console.error("Get treatment type by id error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// CREATE treatment type
router.post("/", async (req, res) => {
  try {
    const {
      name,
      engName,
      workType,
      defaultPrice,
      colorHex,
      sortOrder,
      isActive,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "اسم العلاج مطلوب" });
    }

    const created = await prisma.treatmentType.create({
      data: {
        name: name.trim(),
        engName: engName?.trim() || null,
        workType: workType?.trim() || null,
        defaultPrice: Number(defaultPrice || 0),
        colorHex: colorHex?.trim() || "#35A8FF",
        sortOrder: Number(sortOrder || 0),
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error("Create treatment type error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// UPDATE treatment type
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      name,
      engName,
      workType,
      defaultPrice,
      colorHex,
      sortOrder,
      isActive,
    } = req.body;

    const existing = await prisma.treatmentType.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Treatment type not found" });
    }

    const updated = await prisma.treatmentType.update({
      where: { id },
      data: {
        name: name?.trim() || existing.name,
        engName: engName?.trim() || null,
        workType: workType?.trim() || null,
        defaultPrice: Number(defaultPrice || 0),
        colorHex: colorHex?.trim() || "#35A8FF",
        sortOrder: Number(sortOrder || 0),
        isActive: typeof isActive === "boolean" ? isActive : existing.isActive,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Update treatment type error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE treatment type
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.treatmentType.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Treatment type not found" });
    }

    await prisma.treatmentType.delete({
      where: { id },
    });

    res.json({ message: "Treatment type deleted successfully" });
  } catch (error) {
    console.error("Delete treatment type error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;