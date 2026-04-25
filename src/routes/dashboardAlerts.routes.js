const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const todayAppointmentsCount = await prisma.appointment.count({
      where: {
        appointmentDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    const unpaidInvoicesCount = await prisma.invoice.count({
      where: {
        status: "unpaid",
      },
    });

    const partialInvoicesCount = await prisma.invoice.count({
      where: {
        status: "partial",
      },
    });

    const newPatientsThisWeek = await prisma.patient.count({
      where: {
        createdAt: {
          gte: startOfWeek,
        },
      },
    });

    const alerts = [];

    if (todayAppointmentsCount > 0) {
      alerts.push({
        type: "appointment",
        title: "مواعيد اليوم",
        text: `لديك ${todayAppointmentsCount} موعد اليوم.`,
      });
    }

    if (unpaidInvoicesCount > 0) {
      alerts.push({
        type: "unpaid",
        title: "فواتير غير مدفوعة",
        text: `يوجد ${unpaidInvoicesCount} فاتورة غير مدفوعة.`,
      });
    }

    if (partialInvoicesCount > 0) {
      alerts.push({
        type: "partial",
        title: "فواتير جزئية",
        text: `يوجد ${partialInvoicesCount} فاتورة مدفوعة جزئيًا.`,
      });
    }

    if (newPatientsThisWeek > 0) {
      alerts.push({
        type: "patients",
        title: "مرضى جدد",
        text: `تمت إضافة ${newPatientsThisWeek} مريض جديد خلال آخر 7 أيام.`,
      });
    }

    if (!alerts.length) {
      alerts.push({
        type: "info",
        title: "لا توجد تنبيهات",
        text: "كل شيء هادئ حاليًا ولا توجد تنبيهات إدارية جديدة.",
      });
    }

    res.json(alerts);
  } catch (error) {
    console.error("Dashboard alerts error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;