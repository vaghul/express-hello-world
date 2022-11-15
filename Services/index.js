const express = require("express");
const router = express.Router();
const routeImport = require("./fileimport");
const routeCrypto = require("./cryptoconvert");
const routePortfolio = require("./portfolio");
const routeAllocation = require("./allocations");
const routePurchase = require("./purchases");
const routeDividend = require("./dividend");
const routeExpense = require("./expenses");
const routeReTag = require("./retag");

router.use("/import", routeImport);
router.use("/crypto", routeCrypto);
router.use("/portfolio", routePortfolio);
router.use("/allocations", routeAllocation);
router.use("/purchases", routePurchase);
router.use("/dividend", routeDividend);
router.use("/expenses", routeExpense);
router.use("/retag", routeReTag);

module.exports = router;
