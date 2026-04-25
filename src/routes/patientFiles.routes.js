const express = require("express");
const router = express.Router();

const {
  uploadFile,
  getPatientFiles,
  deletePatientFile,
} = require("../controllers/patientFiles.controller");

const { uploadPatientFile } = require("../middlewares/upload.middleware");

router.get("/:patientId/files", getPatientFiles);
router.post("/:patientId/files", uploadPatientFile.single("file"), uploadFile);
router.delete("/files/:fileId", deletePatientFile);

module.exports = router;
