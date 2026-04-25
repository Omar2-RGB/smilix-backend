const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
const path = require("path");

/* BACKUP */
router.get("/backup", (req, res) => {
  const fileName = `backup-${Date.now()}.sql`;
  const filePath = path.join(__dirname, "../backups", fileName);

  const command = `pg_dump -U postgres -d smilix_db -f "${filePath}"`;

  exec(command, (error) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Backup failed" });
    }

    res.download(filePath);
  });
});

/* RESTORE 🔥 */
router.post("/restore", (req, res) => {
  const filePath = req.body.filePath;

  const command = `psql -U postgres -d smilix_db -f "${filePath}"`;

  exec(command, (error) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Restore failed" });
    }

    res.json({ message: "Restore done" });
  });
});

module.exports = router;