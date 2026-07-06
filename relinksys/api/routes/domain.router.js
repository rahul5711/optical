const express = require("express");
const router = express.Router();

const domainController = require("../controllers/domainController");

router.get("/getInfo", domainController.getInfo);

router.post("/add", domainController.addDomainHandler);

router.post("/details", domainController.getDomainHandler);

router.post("/verify", domainController.verifyDomainHandler);

router.post("/delete", domainController.deleteDomainHandler);

module.exports = router;