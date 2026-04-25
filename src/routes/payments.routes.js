const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

// =========================
// GET all payments (مصححة)
// =========================
router.get("/", async (req, res) => {
  try {
    const { search = "", method = "", patientId = "" } = req.query;

    const where = {};

    // 🔥 أهم تعديل: فلترة حسب المريض
    if (patientId) {
      where.patientId = Number(patientId);
    }

    if (search) {
      where.patient = {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { patientCode: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    if (method) {
      where.paymentMethod = method;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        patient: true,
        invoice: true,
        receivedByUser: true,
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    res.json(payments);
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// =========================
// GET one payment
// =========================
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        patient: true,
        invoice: true,
        receivedByUser: true,
      },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Get payment by id error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// =========================
// CREATE payment
// =========================
router.post("/", async (req, res) => {
  try {
    const {
      patientId,
      invoiceId,
      amount,
      paymentDate,
      paymentMethod,
      notes,
    } = req.body;

    if (!patientId || !amount) {
      return res.status(400).json({
        message: "المريض والمبلغ مطلوبين",
      });
    }

    let invoice = null;

    if (invoiceId) {
      invoice = await prisma.invoice.findUnique({
        where: { id: Number(invoiceId) },
      });

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
    }

    const created = await prisma.payment.create({
      data: {
        patientId: Number(patientId),
        invoiceId: invoiceId ? Number(invoiceId) : null,
        amount: Number(amount),
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod: paymentMethod || "cash",
        notes: notes || null,
        receivedBy: 1,
      },
      include: {
        patient: true,
        invoice: true,
      },
    });

    // تحديث الفاتورة إذا موجودة
    if (invoice) {
      const newPaidAmount =
        Number(invoice.paidAmount || 0) + Number(amount);

      const remainingAmount =
        Number(invoice.finalAmount || invoice.totalAmount || 0) -
        newPaidAmount;

      let status = "unpaid";
      if (remainingAmount <= 0) status = "paid";
      else if (newPaidAmount > 0) status = "partial";

      await prisma.invoice.update({
        where: { id: Number(invoiceId) },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: remainingAmount < 0 ? 0 : remainingAmount,
          status,
        },
      });
    }

    res.status(201).json(created);
  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// =========================
// UPDATE payment
// =========================
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      patientId,
      invoiceId,
      amount,
      paymentDate,
      paymentMethod,
      notes,
    } = req.body;

    const existing = await prisma.payment.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        patientId: Number(patientId),
        invoiceId: invoiceId ? Number(invoiceId) : null,
        amount: Number(amount),
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod: paymentMethod || "cash",
        notes: notes || null,
      },
      include: {
        patient: true,
        invoice: true,
      },
    });

    // إعادة حساب الفاتورة
    const affectedInvoiceIds = [
      existing.invoiceId,
      invoiceId ? Number(invoiceId) : null,
    ].filter(Boolean);

    for (const invId of [...new Set(affectedInvoiceIds)]) {
      const invoicePayments = await prisma.payment.findMany({
        where: { invoiceId: invId },
      });

      const totalPaid = invoicePayments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      );

      const invoice = await prisma.invoice.findUnique({
        where: { id: invId },
      });

      if (invoice) {
        const remainingAmount =
          Number(invoice.finalAmount || invoice.totalAmount || 0) -
          totalPaid;

        let status = "unpaid";
        if (remainingAmount <= 0) status = "paid";
        else if (totalPaid > 0) status = "partial";

        await prisma.invoice.update({
          where: { id: invId },
          data: {
            paidAmount: totalPaid,
            remainingAmount: remainingAmount < 0 ? 0 : remainingAmount,
            status,
          },
        });
      }
    }

    res.json(updated);
  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// =========================
// DELETE payment
// =========================
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.payment.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const invoiceId = existing.invoiceId;

    await prisma.payment.delete({
      where: { id },
    });

    if (invoiceId) {
      const invoicePayments = await prisma.payment.findMany({
        where: { invoiceId },
      });

      const totalPaid = invoicePayments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      );

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (invoice) {
        const remainingAmount =
          Number(invoice.finalAmount || invoice.totalAmount || 0) -
          totalPaid;

        let status = "unpaid";
        if (remainingAmount <= 0) status = "paid";
        else if (totalPaid > 0) status = "partial";

        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount: totalPaid,
            remainingAmount: remainingAmount < 0 ? 0 : remainingAmount,
            status,
          },
        });
      }
    }

    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Delete payment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;