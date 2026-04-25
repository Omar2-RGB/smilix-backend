const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

// GET all reviews
router.get("/", async (req, res) => {
  const data = await prisma.review.findMany({
    orderBy: { id: "desc" }
  });
  res.json(data);
});

// CREATE review
router.post("/", async (req, res) => {
  const { name, rating, comment } = req.body;

  if (!name || !rating || !comment) {
    return res.status(400).json({ message: "كل الحقول مطلوبة" });
  }

  const created = await prisma.review.create({
    data: {
      name,
      rating: Number(rating),
      comment
    }
  });

  res.json(created);
});

module.exports = router;