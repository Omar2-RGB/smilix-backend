const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const prisma = require("../config/db");

// GET all users
router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET one user
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user by id error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// CREATE user
router.post("/", async (req, res) => {
  try {
    const {
      fullName,
      username,
      password,
      roleId,
      isActive,
    } = req.body;

    if (!fullName || !username || !password || !roleId) {
      return res.status(400).json({
        message: "الاسم الكامل واسم المستخدم وكلمة المرور والدور مطلوبة",
      });
    }

    const existing = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    if (existing) {
      return res.status(400).json({ message: "اسم المستخدم مستخدم مسبقًا" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        username: username.trim(),
        passwordHash: hashedPassword,
        roleId: Number(roleId),
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
      include: {
        role: true,
      },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// UPDATE user
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      fullName,
      username,
      password,
      roleId,
      isActive,
    } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username && username.trim() !== existing.username) {
      const userWithSameUsername = await prisma.user.findUnique({
        where: { username: username.trim() },
      });

      if (userWithSameUsername) {
        return res.status(400).json({ message: "اسم المستخدم مستخدم مسبقًا" });
      }
    }

    const data = {
      fullName: fullName?.trim() || existing.fullName,
      username: username?.trim() || existing.username,
      roleId: roleId ? Number(roleId) : existing.roleId,
      isActive: typeof isActive === "boolean" ? isActive : existing.isActive,
    };

    if (password && password.trim()) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE user
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;