const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

// GET all
router.get("/", async (req, res) => {
  try {
    const { search = "", status = "" } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        {
          patient: {
            fullName: {
              contains: search,
              mode: "insensitive"
            }
          }
        },
        {
          labName: {
            contains: search,
            mode: "insensitive"
          }
        },
        {
          workType: {
            contains: search,
            mode: "insensitive"
          }
        },
        {
          toothNumber: {
            contains: search,
            mode: "insensitive"
          }
        }
      ];
    }

    if (status) {
      where.status = status;
    }

    const data = await prisma.labOrder.findMany({
  where,
  include: {
    patient: true,
    expenses: true
  },
  orderBy: {
    id: "desc"
  }
});

    res.json(data);
  } catch (err) {
    console.error("Get lab orders error:", err);
    res.status(500).json({ message: "Error loading lab orders" });
  }
});

// GET one
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

   const item = await prisma.labOrder.findUnique({
  where: { id },
  include: {
    patient: true,
    expenses: true
  }
});

    if (!item) {
      return res.status(404).json({ message: "Lab order not found" });
    }

    res.json(item);
  } catch (err) {
    console.error("Get lab order by id error:", err);
    res.status(500).json({ message: "Error loading lab order" });
  }
});

// CREATE
router.post("/", async (req, res) => {
  try {
    const {
      patientId,
      toothNumber,
      workType,
      labName,
      sentDate,
      expectedDate,
      receivedDate,
      cost,
      paidAmount,
      status,
      notes
    } = req.body;

    if (!patientId || !workType || !labName || !sentDate) {
      return res.status(400).json({
        message: "المريض ونوع العمل واسم المخبر وتاريخ الإرسال مطلوبة"
      });
    }

    const numericCost = Number(cost || 0);

    const result = await prisma.$transaction(async (tx) => {
      const createdLabOrder = await tx.labOrder.create({
        data: {
          patientId: Number(patientId),
          toothNumber: toothNumber || "",
          workType,
          labName,
          sendDate: new Date(sentDate),
          dueDate: expectedDate ? new Date(expectedDate) : null,
          receiveDate: receivedDate ? new Date(receivedDate) : null,
          cost: numericCost,
          status: status || "sent",
          notes: notes || null
        }
      });

      if (numericCost > 0) {
        await tx.expense.create({
          data: {
            title: `تكلفة مخبر - ${labName} - ${workType}`,
            category: "lab",
            amount: numericCost,
            expenseDate: receivedDate ? new Date(receivedDate) : new Date(sentDate),
            notes: notes || `طلب مخبر رقم ${createdLabOrder.id}`,
            createdBy: 1,
            labOrderId: createdLabOrder.id
          }
        });
      }

      return tx.labOrder.findUnique({
        where: { id: createdLabOrder.id },
        include: {
          patient: true,
          expenses: true
        }
      });
    });

    res.status(201).json(result);
  } catch (err) {
    console.error("Create lab order error:", err);
    res.status(500).json({ message: "Error creating lab order" });
  }
});

// UPDATE
 router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      patientId,
      toothNumber,
      workType,
      labName,
      sentDate,
      expectedDate,
      receivedDate,
      cost,
      status,
      notes
    } = req.body;

    const existing = await prisma.labOrder.findUnique({
      where: { id },
      include: { expenses: true }
    });

    if (!existing) {
      return res.status(404).json({ message: "Lab order not found" });
    }

    const numericCost = Number(cost || 0);

    const result = await prisma.$transaction(async (tx) => {
      await tx.labOrder.update({
        where: { id },
        data: {
          patientId: Number(patientId),
          toothNumber: toothNumber || "",
          workType,
          labName,
          sendDate: new Date(sentDate),
          dueDate: expectedDate ? new Date(expectedDate) : null,
          receiveDate: receivedDate ? new Date(receivedDate) : null,
          cost: numericCost,
          status: status || "sent",
          notes: notes || null
        }
      });

      if (numericCost > 0) {
        if (existing.expenses) {
          await tx.expenses.update({
            where: { id: existing.expenses.id },
            data: {
              title: `تكلفة مخبر - ${labName} - ${workType}`,
              category: "lab",
              amount: numericCost,
              expenseDate: receivedDate ? new Date(receivedDate) : new Date(sentDate),
              notes: notes || `طلب مخبر رقم ${id}`
            }
          });
        } else {
          await tx.expenses.create({
            data: {
              title: `تكلفة مخبر - ${labName} - ${workType}`,
              category: "lab",
              amount: numericCost,
              expenseDate: receivedDate ? new Date(receivedDate) : new Date(sentDate),
              notes: notes || `طلب مخبر رقم ${id}`,
              createdBy: 1,
              labOrderId: id
            }
          });
        }
      } else {
        if (existing.expenses) {
          await tx.expenses.delete({
            where: { id: existing.expenses.id }
          });
        }
      }

      return tx.labOrder.findUnique({
        where: { id },
        include: {
          patient: true,
          expenses: true
        }
      });
    });

    res.json(result);
  } catch (err) {
    console.error("Update lab order error:", err);
    res.status(500).json({ message: "Error updating lab order" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.labOrder.findUnique({
      where: { id },
      include: { expenses: true }
    });

    if (!existing) {
      return res.status(404).json({ message: "Lab order not found" });
    }

    await prisma.$transaction(async (tx) => {
      if (existing.expenses) {
        await tx.expenses.delete({
          where: { id: existing.expenses.id }
        });
      }

      await tx.labOrder.delete({
        where: { id }
      });
    });

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete lab order error:", err);
    res.status(500).json({ message: "Error deleting lab order" });
  }
});
router.post("/:id/pay", async (req, res) => {
  const id = Number(req.params.id);
  const amount = Number(req.body.amount);

  const order = await prisma.labOrder.findUnique({ where: { id } });

  if (!order) return res.status(404).json({ message: "Not found" });

  const newPaid = (order.paidAmount || 0) + amount;

  if (newPaid > order.cost) {
    return res.status(400).json({
      message: "⚠️ المبلغ أكبر من المطلوب"
    });
  }

  await prisma.labOrder.update({
    where: { id },
    data: {
      paidAmount: newPaid
    }
  });

  // 🔥 ربط المصاريف
  await prisma.expense.create({
    data: {
      title: `دفع مخبر - ${order.labName}`,
      category: "lab",
      amount: amount,
      expenseDate: new Date()
    }
  });

  res.json({ message: "تم الدفع" });
});

module.exports = router;