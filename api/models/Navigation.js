import mongoose from "mongoose";

const NavigationSchema = new mongoose.Schema({
  item: { 
    type: String, 
    required: true 
  },
  link: { 
    type: String, 
    required: true 
  },
  dropdown: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'inactive' 
  },
  dropdown_content: { 
    type: String, // Rich Text Editor HTML store karega
    default: ''
  },
  active: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  },
  order: { 
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model("Navigation", NavigationSchema);