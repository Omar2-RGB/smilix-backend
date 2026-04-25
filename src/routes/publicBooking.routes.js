const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

// جلب الأوقات المتاحة فقط
router.get("/available-slots", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const slots = await prisma.availableSlot.findMany({
      where: {
        status: "available",
        date: {
          gte: today
        }
      },
      orderBy: [
        { date: "asc" },
        { startTime: "asc" }
      ]
    });

    res.json(slots);
  } catch (error) {
    console.error("Get public slots error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// حجز موعد من الموقع
router.post("/book-appointment", async (req, res) => {
  try {
    const {
      fullName,
      phone,
      notes,
      slotId
    } = req.body;

    if (!fullName || !phone || !slotId) {
      return res.status(400).json({
        message: "الاسم ورقم الهاتف والوقت مطلوبة"
      });
    }

    const slot = await prisma.availableSlot.findUnique({
      where: { id: Number(slotId) }
    });

    if (!slot) {
      return res.status(404).json({
        message: "الوقت غير موجود"
      });
    }

    if (slot.status !== "available") {
      return res.status(400).json({
        message: "هذا الوقت لم يعد متاحًا"
      });
    }

    // هل المريض موجود؟
    let patient = await prisma.patient.findFirst({
      where: {
        phone: phone
      }
    });

    // إذا غير موجود، أنشئ مريض جديد
    if (!patient) {
      const nextCount = await prisma.patient.count();
      const patientCode = `P-${String(nextCount + 1).padStart(4, "0")}`;

      patient = await prisma.patient.create({
        data: {
          patientCode,
          fullName,
          phone,
          notes: notes || "تم الإنشاء من موقع الحجز"
        }
      });
    }

    // إنشاء موعد
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        appointmentDate: slot.date,
        appointmentTime: new Date(`${slot.date.toISOString().split("T")[0]}T${slot.startTime}:00`),
        status: "pending",
        source: "website",
        notes: notes || null
      }
    });

    // تحديث الوقت إلى booked
    await prisma.availableSlot.update({
      where: { id: slot.id },
      data: {
        status: "booked"
      }
    });

    res.status(201).json({
      message: "تم إرسال الحجز بنجاح",
      appointment
    });
  } catch (error) {
    console.error("Book appointment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;