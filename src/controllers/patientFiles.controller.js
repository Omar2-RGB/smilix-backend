const prisma = require("../config/db");
const path = require("path");
const fs = require("fs");

async function uploadFile(req, res) {
  try {
    const patientId = Number(req.params.patientId);
    const { category } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const savedFile = await prisma.patientFile.create({
      data: {
        patientId,
        fileName: req.file.originalname,
        filePath: `/uploads/patients/${req.file.filename}`,
        fileType: req.file.mimetype,
        category: category || "document",
      },
    });

    res.status(201).json(savedFile);
  } catch (error) {
    console.error("Upload file error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getPatientFiles(req, res) {
  try {
    const patientId = Number(req.params.patientId);

    const files = await prisma.patientFile.findMany({
      where: { patientId },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    res.json(files);
  } catch (error) {
    console.error("Get patient files error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function deletePatientFile(req, res) {
  try {
    const fileId = Number(req.params.fileId);

    const file = await prisma.patientFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const absolutePath = path.join(__dirname, "..", "..", file.filePath.replace(/^\//, ""));

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await prisma.patientFile.delete({
      where: { id: fileId },
    });

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete patient file error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  uploadFile,
  getPatientFiles,
  deletePatientFile,
};