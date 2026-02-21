import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({
    type: { type: String, default: 'Home' }, 
    name: { type: String, required: true },   
    houseNo: { type: String, required: true },
    street: { type: String, required: true },
    landmark: { type: String,default:"" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
    phone: { type: String, required: true },  
    isDefault: { type: Boolean, default: false }
});

const userSchema = mongoose.Schema({
    // 🟢 SECTION 1: REGISTRATION & IDENTITY
    // Note: 'name' required hai taaki purana code chalta rahe.
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        lowercase: true,
       
    },
    
    // 🆕 Admin Panel Compatibility Fields (Auto-managed)
    firstname: { type: String, trim: true, default: "" },
    lastname: { type: String, trim: true, default: "" },
    username: { type: String, trim: true, default: "" },
    company: { type: String, trim: true, default: "" }, // 🆕 From Image

    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please fill a valid email address"
        ]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        trim: true,
        minlength: [6, "Password must be at least 6 characters long"],
    },

    // 🟡 SECTION 2: PROFILE FIELDS
    profileImage: { type: String, default: "" },
    phone: { type: String, trim: true,sparse: true},
    
    // Address Details
    address: [AddressSchema],
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    pincode: { type: String, trim: true, default: "" },
    country: { type: String, default: "India" }, // 🆕 Added for safety

    gender: {
        type: String,
        enum: ["male", "female", "other", ""],
        default: ""
    },

    // 🔵 SECTION 3: MEMBERSHIP & STATUS (New for Admin)
    role: {
        type: String,
        default: "user",
        enum: ["user", "admin"]
    },
    
    // Status: 1 = Active, 0 = Inactive (Purana logic maintain kiya hai)
    status: {
        type: Number,
        default: 1, 
    },

    // 🆕 Membership Fields
    membership: {
        type: String,
        enum: ["active", "inactive"], 
        default: "inactive"
    },
    membershipStart: { type: Date}, // 🆕
    membershipEnd: { type: Date },   // 🆕
    
    // 🆕 Guest Logic
    isGuest: {
        type: String,
        enum: ["active", "inactive"],
        default: "inactive"
    },

    // ❤️ Wishlist
    wishlist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }
    ]
}, {
    timestamps: true
});

// 🛡️ SMART HOOK: Name Sync Logic (Magic happens here)
// Data save hone se pehle ye function chalega
userSchema.pre('save', function (next) {
    // Case 1: Agar 'name' change hua hai, to firstname/lastname update karo
    if (this.isModified('name')) {
        const parts = this.name.split(' ');
        this.firstname = parts[0] || "";
        this.lastname = parts.slice(1).join(' ') || "";
    }
    // Case 2: Agar 'firstname' ya 'lastname' change hua hai (Admin panel se), to 'name' update karo
    else if (this.isModified('firstname') || this.isModified('lastname')) {
        this.name = `${this.firstname} ${this.lastname}`.trim();
    }
    next();
});

const UserSchemaModel = mongoose.model('User', userSchema);
export default UserSchemaModel;