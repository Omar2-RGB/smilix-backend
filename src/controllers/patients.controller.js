const prisma = require("../config/db");

function normalizeGender(value) {
  if (!value) return null;
  const v = value.trim().toLowerCase();

  if (["male", "m", "ذكر"].includes(v)) return "male";
  if (["female", "f", "أنثى", "انثى"].includes(v)) return "female";

  return value;
}

function generatePatientCode() {
  const now = Date.now().toString().slice(-6);
  return `PT-${now}`;
}

async function getPatients(req, res) {
  try {
    const { search = "" } = req.query;

    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { patientCode: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(patients);
  } catch (error) {
    console.error("Get patients error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getPatientById(req, res) {
  try {
    const id = Number(req.params.id);

    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json(patient);
  } catch (error) {
    console.error("Get patient by id error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function createPatient(req, res) {
  try {
    const {
      fullName,
      phone,
      gender,
      birthDate,
      address,
      notes,
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: "Full name is required" });
    }

    const patient = await prisma.patient.create({
      data: {
        patientCode: generatePatientCode(),
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
        gender: normalizeGender(gender),
        birthDate: birthDate ? new Date(birthDate) : null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    res.status(201).json(patient);
  } catch (error) {
    console.error("Create patient error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function updatePatient(req, res) {
  try {
    const id = Number(req.params.id);
    const {
      fullName,
      phone,
      gender,
      birthDate,
      address,
      notes,
    } = req.body;

    const existing = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        fullName: fullName?.trim() || existing.fullName,
        phone: phone?.trim() || null,
        gender: normalizeGender(gender),
        birthDate: birthDate ? new Date(birthDate) : null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Update patient error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function deletePatient(req, res) {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: "Patient not found" });
    }

    await prisma.patient.delete({
      where: { id },
    });

    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("Delete patient error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};