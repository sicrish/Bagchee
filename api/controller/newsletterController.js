import NewsletterSubscriber from '../models/NewsletterSubscriber.js';

// 🟢 1. Create (Save)
export const saveSubscriber = async (req, res) => {
    try {
        const { email, firstName, lastName, categories } = req.body;

        // Check duplicate email
        const existingSub = await NewsletterSubscriber.findOne({ email });
        if (existingSub) {
            return res.status(400).json({ status: false, msg: "Email already subscribed!" });
        }

        const newSub = new NewsletterSubscriber({
            email,
            firstname: firstName, // Frontend 'firstName' -> Backend 'firstname'
            lastname: lastName,   // Frontend 'lastName' -> Backend 'lastname'
            categories
        });

        await newSub.save();

        res.status(201).json({
            status: true,
            msg: "Subscriber added successfully!",
            data: newSub
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// 🟢 2. Read All (List)
export const getAllSubscribers = async (req, res) => {
    try {
        // Sort descending (latest first)
        const subscribers = await NewsletterSubscriber.find().sort({ createdAt: -1 });

        res.status(200).json({
            status: true,
            data: subscribers
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// 🟢 3. Read One (Get by ID for Edit)
export const getSubscriberById = async (req, res) => {
    try {
        const subscriber = await NewsletterSubscriber.findById(req.params.id);

        if (!subscriber) {
            return res.status(404).json({ status: false, msg: "Subscriber not found" });
        }

        res.status(200).json({
            status: true,
            data: subscriber
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// 🟢 4. Update
export const updateSubscriber = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, firstName, lastName, categories } = req.body;

        const updatedData = {
            email,
            firstname: firstName, 
            lastname: lastName,
            categories
        };

        const subscriber = await NewsletterSubscriber.findByIdAndUpdate(
            id, 
            updatedData, 
            { new: true } // Updated document return karega
        );

        if (!subscriber) {
            return res.status(404).json({ status: false, msg: "Subscriber not found" });
        }

        res.status(200).json({
            status: true,
            msg: "Subscriber updated successfully!",
            data: subscriber
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};

// 🟢 5. Delete
export const deleteSubscriber = async (req, res) => {
    try {
        const subscriber = await NewsletterSubscriber.findByIdAndDelete(req.params.id);

        if (!subscriber) {
            return res.status(404).json({ status: false, msg: "Subscriber not found" });
        }

        res.status(200).json({
            status: true,
            msg: "Subscriber deleted successfully!"
        });

    } catch (error) {
        res.status(500).json({ status: false, msg: "Server Error", error: error.message });
    }
};