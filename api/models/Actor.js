import mongoose from "mongoose";

const ActorSchema = new mongoose.Schema({
  first_name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  last_name: { 
    type: String, 
    trim: true 
  },
  picture: { 
    type: String, // Yahan image ka URL ya path store hoga
    default: ''
  },
  origin: { 
    type: String, 
    trim: true,
    default: ''
  },
  profile: { 
    type: String, // Rich Text Editor ka HTML content yahan aayega
    default: ''
  }
}, { timestamps: true });

export default mongoose.model("Actor", ActorSchema);