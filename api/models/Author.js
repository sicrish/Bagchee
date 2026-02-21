import mongoose from "mongoose";

const AuthorSchema = new mongoose.Schema({
  first_name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  last_name: { 
    type: String, 
    trim: true, 
    default: ''
  },
  picture: { 
    type: String, // Stores image path/URL
    default: ''
  },
  origin: { 
    type: String, // e.g., UK, India
    trim: true,
    default: ''
  },
  profile: { 
    type: String, // Rich Text Content (Biography)
    default: ''
  }
}, { timestamps: true });

export default mongoose.model("Author", AuthorSchema);