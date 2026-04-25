const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

// GET all invoices
router.get("/", async (req, res) => {
  try {
    const { search = "", status = "" } = req.query;

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

    if (status) {
      where.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        patient: true,
        createdByUser: true,
        invoiceItems: {
          include: {
            treatmentSession: {
              include: {
                treatmentType: true,
              },
            },
          },
        },
        payments: true,
      },
      orderBy: {
        invoiceDate: "desc",
      },
    });

    res.json(invoices);
  } catch (error) {
    console.error("Get invoices error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET one invoice
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        createdByUser: true,
        invoiceItems: {
          include: {
            treatmentSession: {
              include: {
                treatmentType: true,
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error) {
    console.error("Get invoice by id error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// CREATE invoice
router.post("/", async (req, res) => {
  try {
    const { patientId, invoiceDate, notes, items = [] } = req.body;

    if (!patientId || !invoiceDate) {
      return res.status(400).json({ message: "المريض وتاريخ الفاتورة مطلوبان" });
    }

    const cleanedItems = items
      .filter((item) => {
        const hasName = (item.itemName || item.description || "").trim() !== "";
        const hasPrice = Number(item.unitPrice || 0) > 0 || Number(item.totalPrice || item.amount || 0) > 0;
        return hasName || hasPrice;
      })
      .map((item) => {
        const qty = Number(item.qty || item.quantity || 1);
        const unitPrice = Number(item.unitPrice || 0);
        const totalPrice =
          Number(item.totalPrice || item.amount || 0) || qty * unitPrice;

        const base = {
          itemName: item.itemName || item.description || "خدمة",
          qty,
          unitPrice,
          totalPrice,
          notes: item.notes || null,
        };

        if (item.treatmentSessionId) {
          return {
            ...base,
            treatmentSession: {
              connect: { id: Number(item.treatmentSessionId) },
            },
          };
        }

        return base;
      });

    const totalAmount = cleanedItems.reduce(
      (sum, item) => sum + Number(item.totalPrice || 0),
      0
    );

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const created = await prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId: Number(patientId),
        invoiceDate: new Date(invoiceDate),
        totalAmount,
        discountAmount: 0,
        finalAmount: totalAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        status: totalAmount > 0 ? "unpaid" : "paid",
        notes: notes || null,
        createdBy: 1,
        invoiceItems: {
          create: cleanedItems,
        },
      },
      include: {
        patient: true,
        invoiceItems: true,
      },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error("Create invoice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// UPDATE invoice
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { patientId, invoiceDate, notes, items = [] } = req.body;

    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const cleanedItems = items
      .filter((item) => {
        const hasName = (item.itemName || item.description || "").trim() !== "";
        const hasPrice = Number(item.unitPrice || 0) > 0 || Number(item.totalPrice || item.amount || 0) > 0;
        return hasName || hasPrice;
      })
      .map((item) => {
        const qty = Number(item.qty || item.quantity || 1);
        const unitPrice = Number(item.unitPrice || 0);
        const totalPrice =
          Number(item.totalPrice || item.amount || 0) || qty * unitPrice;

        const base = {
          itemName: item.itemName || item.description || "خدمة",
          qty,
          unitPrice,
          totalPrice,
          notes: item.notes || null,
        };

        if (item.treatmentSessionId) {
          return {
            ...base,
            treatmentSession: {
              connect: { id: Number(item.treatmentSessionId) },
            },
          };
        }

        return base;
      });

    const totalAmount = cleanedItems.reduce(
      (sum, item) => sum + Number(item.totalPrice || 0),
      0
    );

    const paidAmount = Number(existing.paidAmount || 0);
    const remainingAmount = totalAmount - paidAmount;

    let status = "unpaid";
    if (remainingAmount <= 0) status = "paid";
    else if (paidAmount > 0) status = "partial";

    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id },
    });

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        patientId: Number(patientId),
        invoiceDate: new Date(invoiceDate),
        totalAmount,
        finalAmount: totalAmount,
        remainingAmount: remainingAmount < 0 ? 0 : remainingAmount,
        status,
        notes: notes || null,
        invoiceItems: {
          create: cleanedItems,
        },
      },
      include: {
        patient: true,
        invoiceItems: {
          include: {
            treatmentSession: {
              include: {
                treatmentType: true,
              },
            },
          },
        },
        payments: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Update invoice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE invoice
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    await prisma.invoice.delete({
      where: { id },
    });

    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Delete invoice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;