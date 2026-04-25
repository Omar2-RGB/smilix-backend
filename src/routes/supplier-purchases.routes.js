const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

// GET all supplier purchases
router.get("/", async (req, res) => {
  try {
    const { search = "", supplierId = "" } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        {
          supplier: {
            name: { contains: search, mode: "insensitive" }
          }
        },
        {
          items: {
            some: {
              itemName: { contains: search, mode: "insensitive" }
            }
          }
        }
      ];
    }

    if (supplierId) {
      where.supplierId = Number(supplierId);
    }

    const data = await prisma.supplierPurchase.findMany({
      where,
      include: {
        supplier: true,
        items: true,
        expenses: true
      },
      orderBy: {
        id: "desc"
      }
    });

    res.json(data);
  } catch (error) {
    console.error("Get supplier purchases error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET one
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const item = await prisma.supplierPurchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: true,
        expenses: true
      }
    });

    if (!item) {
      return res.status(404).json({ message: "Supplier purchase not found" });
    }

    res.json(item);
  } catch (error) {
    console.error("Get supplier purchase by id error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// CREATE
router.post("/", async (req, res) => {
  try {
    const {
      supplierId,
      title,
      purchaseDate,
      notes,
      items
    } = req.body;

    if (!supplierId || !title || !purchaseDate || !Array.isArray(items) || !items.length) {
      return res.status(400).json({
        message: "المورد والعنوان والتاريخ والأصناف مطلوبة"
      });
    }

    const cleanItems = items
      .map((item) => ({
        itemName: String(item.itemName || "").trim(),
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0)
      }))
      .filter((item) => item.itemName && item.quantity > 0 && item.unitPrice >= 0);

    if (!cleanItems.length) {
      return res.status(400).json({
        message: "يجب إدخال صنف واحد على الأقل بشكل صحيح"
      });
    }

    const itemsWithTotals = cleanItems.map((item) => ({
      ...item,
      totalPrice: item.quantity * item.unitPrice
    }));

    const totalAmount = itemsWithTotals.reduce((sum, item) => sum + item.totalPrice, 0);

    const created = await prisma.supplierPurchase.create({
      data: {
        supplierId: Number(supplierId),
        title,
        purchaseDate: new Date(purchaseDate),
        totalAmount,
        paidAmount: 0,
        notes: notes || null,
        items: {
          create: itemsWithTotals.map((item) => ({
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }))
        }
      },
      include: {
        supplier: true,
        items: true,
        expenses: true
      }
    });

    res.status(201).json(created);
  } catch (error) {
    console.error("Create supplier purchase error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      supplierId,
      title,
      purchaseDate,
      notes,
      items
    } = req.body;

    const existing = await prisma.supplierPurchase.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existing) {
      return res.status(404).json({ message: "Supplier purchase not found" });
    }

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({
        message: "الأصناف مطلوبة"
      });
    }

    const cleanItems = items
      .map((item) => ({
        itemName: String(item.itemName || "").trim(),
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0)
      }))
      .filter((item) => item.itemName && item.quantity > 0 && item.unitPrice >= 0);

    if (!cleanItems.length) {
      return res.status(400).json({
        message: "يجب إدخال صنف واحد على الأقل بشكل صحيح"
      });
    }

    const itemsWithTotals = cleanItems.map((item) => ({
      ...item,
      totalPrice: item.quantity * item.unitPrice
    }));

    const totalAmount = itemsWithTotals.reduce((sum, item) => sum + item.totalPrice, 0);

    if (totalAmount < Number(existing.paidAmount || 0)) {
      return res.status(400).json({
        message: "إجمالي الفاتورة لا يمكن أن يكون أقل من المدفوع"
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.supplierPurchaseItem.deleteMany({
        where: { supplierPurchaseId: id }
      });

      await tx.supplierPurchase.update({
        where: { id },
        data: {
          supplierId: Number(supplierId),
          title,
          purchaseDate: new Date(purchaseDate),
          totalAmount,
          notes: notes || null,
          items: {
            create: itemsWithTotals.map((item) => ({
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice
            }))
          }
        }
      });

      return tx.supplierPurchase.findUnique({
        where: { id },
        include: {
          supplier: true,
          items: true,
          expenses: true
        }
      });
    });

    res.json(updated);
  } catch (error) {
    console.error("Update supplier purchase error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PAY
router.post("/:id/pay", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const amount = Number(req.body.amount || 0);

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "مبلغ الدفع غير صالح" });
    }

    const purchase = await prisma.supplierPurchase.findUnique({
      where: { id },
      include: { supplier: true }
    });

    if (!purchase) {
      return res.status(404).json({ message: "Supplier purchase not found" });
    }

    const newPaid = Number(purchase.paidAmount || 0) + amount;

    if (newPaid > Number(purchase.totalAmount || 0)) {
      return res.status(400).json({
        message: "المبلغ أكبر من الباقي المطلوب"
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const purchaseUpdated = await tx.supplierPurchase.update({
        where: { id },
        data: {
          paidAmount: newPaid
        }
      });

      await tx.expense.create({
        data: {
          title: `دفع مورد - ${purchase.supplier?.name || "مورد"} - ${purchase.title}`,
          category: "supplier",
          amount: amount,
          expenseDate: new Date(),
          notes: `دفعة على فاتورة مورد رقم ${purchase.id}`,
          supplierPurchaseId: purchase.id
        }
      });

      return purchaseUpdated;
    });

    res.json(updated);
  } catch (error) {
    console.error("Pay supplier purchase error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.supplierPurchase.findUnique({
      where: { id },
      include: {
        expenses: true,
        items: true
      }
    });

    if (!existing) {
      return res.status(404).json({ message: "Supplier purchase not found" });
    }

    await prisma.$transaction(async (tx) => {
      if (existing.expenses?.length) {
        for (const exp of existing.expenses) {
          await tx.expense.delete({
            where: { id: exp.id }
          });
        }
      }

      await tx.supplierPurchaseItem.deleteMany({
        where: { supplierPurchaseId: id }
      });

      await tx.supplierPurchase.delete({
        where: { id }
      });
    });

    res.json({ message: "Supplier purchase deleted successfully" });
  } catch (error) {
    console.error("Delete supplier purchase error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;