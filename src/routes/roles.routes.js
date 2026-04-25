const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

// GET all roles
router.get("/", async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: {
        id: "asc",
      },
    });

    res.json(roles);
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;