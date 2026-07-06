const express = require("express");
const router = express.Router();

const domainController = require("../controllers/domainController");

router.get("/", domainController.getInfo);

router.post("/add", domainController.addDomainHandler);

router.get("/details", domainController.getDomainHandler);

router.get("/verify", domainController.verifyDomainHandler);

router.delete("/delete", domainController.deleteDomainHandler);

module.exports = router;