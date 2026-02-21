import mongoose from "mongoose";

const ArtistSchema = new mongoose.Schema({
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
  role: { 
    type: String, // e.g., Singer, Director
    trim: true,
    default: ''
  },
  origin: { 
    type: String, // e.g., USA, India
    trim: true,
    default: ''
  },
  profile: { 
    type: String, // Stores Rich Text Editor HTML
    default: ''
  }
}, { timestamps: true });

export default mongoose.model("Artist", ArtistSchema);