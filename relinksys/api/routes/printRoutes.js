const express = require("express");
const router = express.Router();
const multer = require("multer");

const printController = require("../controllers/printController");

const upload = multer({
    dest: "uploads/",
});

// ===============================
// Health Check
// ===============================
router.get("/getInfo", printController.getInfo);

// ===============================
// Get Default Printer
// ===============================
router.get("/getDefaultPrinter", printController.getPrintersHandler);

// ===============================
// Print PDF From URL
// ===============================
router.post(
    "/printURL",
    printController.printURLHandler
);



module.exports = router;