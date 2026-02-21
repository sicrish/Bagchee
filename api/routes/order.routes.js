import express from "express";
import * as OrderController from "../controller/order.controller.js";

const router = express.Router();

router.post("/save", OrderController.saveOrder);
router.get("/list", OrderController.getAllOrders);
router.get("/get/:id", OrderController.getOrderById);
router.patch("/update/:id", OrderController.updateOrder);
router.delete("/delete/:id", OrderController.deleteOrder);
router.get('/my-orders', OrderController.getUserOrders);
export default router;