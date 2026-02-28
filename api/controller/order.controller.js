import OrderModel from "../models/Order.js";

// ==========================================
// 🟢 1. SAVE ORDER (Create New)
// ==========================================
export const saveOrder = async (req, res) => {
    try {
        const { customer_id, products, total } = req.body;

        // 1. Order Number Generate karein (Unique ID: ORD-TIMESTAMP-RANDOM)
        const order_number = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 2. Data Prepare karein
        const newOrder = new OrderModel({
            ...req.body,
            order_number: order_number, // Auto generated
            status: req.body.status || 'Not yet ordered',
            payment_status: req.body.payment_status || 'pending',
            created_at: new Date()
        });

        // 3. Save to Database
        const savedOrder = await newOrder.save();

        res.status(201).json({ 
            status: true, 
            msg: "Order placed successfully! 🎉", 
            data: savedOrder 
        });

    } catch (error) {
        console.error("Save Order Error:", error);
        // Duplicate Key Error handling (agar order number same ho jaye)
        if (error.code === 11000) {
            return res.status(400).json({ status: false, msg: "Order Number conflict. Please try again." });
        }
        res.status(500).json({ status: false, msg: "Order Creation Failed", error: error.message });
    }
};

// ==========================================
// 🔵 2. GET ALL ORDERS (Admin List with Pagination)
// ==========================================
export const getAllOrders = async (req, res) => {
    try {
        const { page, limit, status, search, customer_id } = req.query;

        // --- Pagination Setup ---
        const pageNum = Number(page) || 1;
        const pageSize = Number(limit) || 10;
        const skip = (pageNum - 1) * pageSize;

        // --- Filter Setup ---
        let query = {};

        // 1. Specific User ke liye (My Orders logic)
        if (customer_id) {
            query.customer_id = customer_id;
        }

        // 2. Status Filter (e.g. ?status=Shipped)
        if (status && status !== 'All') {
            query.status = status;
        }

        // 3. Search (Order No, Email, Phone)
        if (search) {
            query.$or = [
                { order_number: { $regex: search, $options: 'i' } },
                { 'shipping_details.email': { $regex: search, $options: 'i' } },
                { 'shipping_details.phone': { $regex: search, $options: 'i' } }
            ];
        }

        // --- Database Call ---
        const orders = await OrderModel.find(query)
            .populate('customer_id', 'name email') // User ka naam bhi layein
            .sort({ created_at: -1 }) // Newest First
            .skip(skip)
            .limit(pageSize);

        const total = await OrderModel.countDocuments(query);

        res.status(200).json({ 
            status: true, 
            data: orders, 
            total, 
            page: pageNum, 
            limit: pageSize,
            totalPages: Math.ceil(total / pageSize)
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟡 3. GET SINGLE ORDER (By ID)
// ==========================================
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await OrderModel.findById(id)
            .populate('customer_id', 'name email mobile') // User Details
            .populate('coupon_id', 'code discount');      // Coupon Details

        if (!order) {
            return res.status(404).json({ status: false, msg: "Order not found" });
        }

        res.status(200).json({ status: true, data: order });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// ==========================================
// 🟠 4. UPDATE ORDER (Status Change etc.)
// ==========================================
export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;

        // 🔍 CHECKPOINT 1: Dekho data aa kya raha hai
        // console.log("Updating Order ID:", id);
        // console.log("Incoming Payload Data:", req.body);
        
        // $set operator ensures only provided fields are updated
        const updatedOrder = await OrderModel.findByIdAndUpdate(
            id, 
            { $set: req.body }, 
            { new: true, runValidators: true } // Returns updated doc & checks enum validation
        );

        if (!updatedOrder) {
            return res.status(404).json({ status: false, msg: "Order not found" });
        }

        res.status(200).json({ status: true, msg: "Order Updated Successfully", data: updatedOrder });

    } catch (error) {
        console.error("❌ BACKEND UPDATE ERROR:", error.message);
        res.status(500).json({ status: false, msg: "Update Failed", error: error.message });
    }
};

// ==========================================
// 🔴 5. DELETE ORDER
// ==========================================
export const deleteOrder = async (req, res) => {
    try {
        const deleted = await OrderModel.findByIdAndDelete(req.params.id);
        
        if (!deleted) {
            return res.status(404).json({ status: false, msg: "Order not found" });
        }

        res.status(200).json({ status: true, msg: "Order Deleted Successfully" });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Delete Failed", error: error.message });
    }
};

// ==========================================
// 🟣 6. USER MY ORDERS (Specific Route Logic)
// ==========================================
// Ye function frontend ke '/my-orders' call ko handle karega
export const getUserOrders = async (req, res) => {
    try {
        // Frontend se 'customer_id' query me aayega (e.g., ?customer_id=123)
        // Ya agar Auth Middleware hai to 'req.user._id'
        const customer_id = req.query.customer_id || req.user?._id;

        if (!customer_id) {
            return res.status(400).json({ status: false, msg: "User ID is required" });
        }

        const orders = await OrderModel.find({ customer_id }).sort({ created_at: -1 });
        
        res.status(200).json({ status: true, data: orders });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};