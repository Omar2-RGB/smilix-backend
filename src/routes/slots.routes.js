const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

// 🔹 جلب كل الأوقات
router.get("/", async (req, res) => {
  try {
    const slots = await prisma.availableSlot.findMany({
      orderBy: { date: "asc" }
    });

    res.json(slots);
  } catch (error) {
    console.error("Get slots error:", error);
    res.status(500).json({ message: "Error fetching slots" });
  }
});

// 🔹 إضافة وقت جديد
router.post("/", async (req, res) => {
  try {
    const { doctorId, date, startTime, endTime } = req.body;

    // 🔥 تحقق إذا الوقت موجود مسبقًا
    const existing = await prisma.availableSlot.findFirst({
  where: {
    date: new Date(date),
    doctorId: doctorId || null,
    AND: [
      {
        startTime: { lt: endTime }
      },
      {
        endTime: { gt: startTime }
      }
    ]
  }
});

    if (existing) {
      return res.status(400).json({
        message: "هذا الوقت موجود مسبقاً ❌"
      });
    }

    const created = await prisma.availableSlot.create({
      data: {
        doctorId: doctorId || null,
        date: new Date(date),
        startTime,
        endTime
      }
    });

    res.json(created);

  } catch (error) {
    console.error("Create slot error:", error);
    res.status(500).json({ message: "Error creating slot" });
  }
});

router.put("/:id/confirm", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: "confirmed"
      },
      include: {
        patient: true // 🔥 مهم جداً
      }
    });

    res.json(updated);
  } catch (error) {
    console.error("Confirm appointment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 🔹 حذف وقت
router.delete("/:id", async (req, res) => {
  try {
    await prisma.availableSlot.delete({
      where: { id: Number(req.params.id) }
    });

    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Delete slot error:", error);
    res.status(500).json({ message: "Error deleting slot" });
  }
});

module.exports = router;