import Actor from "../models/Actor.js";
// 🟢 1. Local Utilities Import
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// ==========================================
// 🟢 1. CREATE (SAVE ACTOR)
// ==========================================
export const saveActor = async (req, res) => {
  try {
    const { first_name, last_name, origin, profile } = req.body;

    // Validation
    if (!first_name || first_name.trim() === "") {
      return res.status(400).json({ status: false, msg: "First Name is required." });
    }

    // 🖼️ Handle Actor Picture (Local Storage)
    let picturePath = "";
    if (req.files && (req.files.picture || req.files.image)) {
      try {
        const file = req.files.picture || req.files.image;
        // 'actors' sub-folder me save hoga: uploads/actors/
        picturePath = await saveFileLocal(file, 'actors');
      } catch (uploadError) {
        return res.status(400).json({ status: false, msg: uploadError.message });
      }
    }

    const newActor = new Actor({
      first_name: first_name.trim(),
      last_name: last_name ? last_name.trim() : "",
      picture: picturePath, // Path like: "/uploads/actors/hero-123.jpg"
      origin,
      profile
    });

    await newActor.save();

    res.status(201).json({ 
      status: true, 
      msg: "Actor added successfully!", 
      data: newActor 
    });

  } catch (error) {
    console.error("Error saving actor:", error);
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🔵 2. READ ALL (FETCH LIST)
// ==========================================
export const getAllActors = async (req, res) => {
  try {
    // Alphabetical sorting (A-Z) makes admin panel easier to navigate
    const actors = await Actor.find().sort({ first_name: 1 });
    res.status(200).json({ status: true, data: actors });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🟡 3. READ ONE
// ==========================================
export const getActorById = async (req, res) => {
  try {
    const actor = await Actor.findById(req.params.id);
    if (!actor) {
      return res.status(404).json({ status: false, msg: "Actor not found" });
    }
    res.status(200).json({ status: true, data: actor });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🟠 4. UPDATE (SAFE IMAGE SWAP)
// ==========================================
export const updateActor = async (req, res) => {
  try {
    const { id } = req.params;
    const existingActor = await Actor.findById(id);

    if (!existingActor) {
      return res.status(404).json({ status: false, msg: "Actor not found" });
    }

    let updateData = { ...req.body };

    // 🖼️ Handle Image Update
    if (req.files && (req.files.picture || req.files.image)) {
      try {
        const file = req.files.picture || req.files.image;
        const newPath = await saveFileLocal(file, 'actors');

        if (newPath) {
          // Nayi image milte hi purani folder se delete karo
          if (existingActor.picture) {
            await deleteFileLocal(existingActor.picture);
          }
          updateData.picture = newPath;
        }
      } catch (uploadError) {
        return res.status(400).json({ status: false, msg: uploadError.message });
      }
    }

    const updatedActor = await Actor.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true } 
    );

    res.status(200).json({ 
      status: true, 
      msg: "Actor updated successfully!", 
      data: updatedActor 
    });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Update failed", error: error.message });
  }
};

// ==========================================
// 🔴 5. DELETE (LOCAL CLEANUP)
// ==========================================
export const deleteActor = async (req, res) => {
  try {
    const { id } = req.params;
    const actor = await Actor.findById(id);

    if (!actor) {
      return res.status(404).json({ status: false, msg: "Actor not found" });
    }

    // 🗑️ Database se pehle folder se image delete karein
    if (actor.picture) {
      await deleteFileLocal(actor.picture);
    }

    await Actor.findByIdAndDelete(id);

    res.status(200).json({ status: true, msg: "Actor deleted successfully!" });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Delete failed", error: error.message });
  }
};