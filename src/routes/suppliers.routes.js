const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

// GET all suppliers
router.get("/", async (req, res) => {
  try {
    const { search = "" } = req.query;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } }
          ]
        }
      : {};

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { id: "desc" }
    });

    res.json(suppliers);
  } catch (error) {
    console.error("Get suppliers error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET one supplier
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const supplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.json(supplier);
  } catch (error) {
    console.error("Get supplier by id error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// CREATE supplier
router.post("/", async (req, res) => {
  try {
    const { name, phone, company, address, notes } = req.body;

    if (!name) {
      return res.status(400).json({ message: "اسم المورد مطلوب" });
    }

    const created = await prisma.supplier.create({
      data: {
        name,
        phone: phone || null,
        company: company || null,
        address: address || null,
        notes: notes || null
      }
    });

    res.status(201).json(created);
  } catch (error) {
    console.error("Create supplier error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// UPDATE supplier
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, phone, company, address, notes } = req.body;

    const existing = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        phone: phone || null,
        company: company || null,
        address: address || null,
        notes: notes || null
      }
    });

    res.json(updated);
  } catch (error) {
    console.error("Update supplier error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE supplier
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    await prisma.supplier.delete({
      where: { id }
    });

    res.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("Delete supplier error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;