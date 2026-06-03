const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");

// Create Order
router.post("/create-order", paymentController.createOrder);

// Verify Payment
router.post("/verify", paymentController.verifyPayment);

module.exports = router;
