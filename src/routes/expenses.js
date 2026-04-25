const router = require("express").Router();
const prisma = require("../config/db");

// GET
router.get("/", async (req,res)=>{
  const data = await prisma.expense.findMany({
    orderBy:{ id:"desc" }
  });
  res.json(data);
});

// POST
router.post("/", async (req,res)=>{
  try {
    const data = await prisma.expense.create({
      data:{
        title: req.body.title || "",
        category: req.body.category || "general",
        amount: Number(req.body.amount || 0),

        expenseDate: req.body.expenseDate
          ? new Date(req.body.expenseDate)
          : new Date(),

        notes: req.body.notes || ""
      }
    });

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error" });
  }
});
// DELETE
router.delete("/:id", async (req,res)=>{
  await prisma.expense.delete({
    where:{ id:Number(req.params.id) }
  });
  res.json({message:"deleted"});
});

module.exports = router;