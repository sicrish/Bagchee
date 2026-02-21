import Artist from "../models/Artist.js";
// 🟢 1. Local Utilities Import
import { saveFileLocal, deleteFileLocal } from '../utils/fileHandler.js';

// ==========================================
// 🟢 1. CREATE (SAVE ARTIST)
// ==========================================
export const saveArtist = async (req, res) => {
  try {
    const { first_name, last_name, role, origin, profile } = req.body;

    // Validation
    if (!first_name || first_name.trim() === "") {
      return res.status(400).json({ status: false, msg: "First Name is required." });
    }

    // 🖼️ Handle Artist Picture (Local Storage)
    let picturePath = "";
    if (req.files && (req.files.picture || req.files.image)) {
      try {
        const file = req.files.picture || req.files.image;
        // 'artists' sub-folder me save hoga
        picturePath = await saveFileLocal(file, 'artists');
      } catch (uploadError) {
        return res.status(400).json({ status: false, msg: uploadError.message });
      }
    }

    const newArtist = new Artist({
      first_name: first_name.trim(),
      last_name: last_name ? last_name.trim() : "",
      picture: picturePath, // e.g., "/uploads/artists/artist-123.jpg"
      role: role || "",
      origin: origin || "",
      profile: profile || ""
    });

    await newArtist.save();

    res.status(201).json({ 
      status: true, 
      msg: "Artist added successfully!", 
      data: newArtist 
    });

  } catch (error) {
    console.error("Error saving artist:", error);
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🔵 2. READ ALL (FETCH LIST)
// ==========================================
export const getAllArtists = async (req, res) => {
  try {
    // Sort Alphabetically by First Name
    const artists = await Artist.find().sort({ first_name: 1 });
    res.status(200).json({ status: true, data: artists });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🟡 3. READ ONE
// ==========================================
export const getArtistById = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ status: false, msg: "Artist not found" });
    }
    res.status(200).json({ status: true, data: artist });
  } catch (error) {
    res.status(500).json({ status: false, msg: "Server Error", error: error.message });
  }
};

// ==========================================
// 🟠 4. UPDATE (SAFE IMAGE SWAP)
// ==========================================
export const updateArtist = async (req, res) => {
  try {
    const { id } = req.params;
    const existingArtist = await Artist.findById(id);

    if (!existingArtist) {
      return res.status(404).json({ status: false, msg: "Artist not found" });
    }

    let updateData = { ...req.body };

    // 🖼️ Handle Image Update (Delete old if new exists)
    if (req.files && (req.files.picture || req.files.image)) {
      try {
        const file = req.files.picture || req.files.image;
        const newPath = await saveFileLocal(file, 'artists');

        if (newPath) {
          // Purani image delete karein
          if (existingArtist.picture) {
            await deleteFileLocal(existingArtist.picture);
          }
          updateData.picture = newPath;
        }
      } catch (uploadError) {
        return res.status(400).json({ status: false, msg: uploadError.message });
      }
    }

    const updatedArtist = await Artist.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true } 
    );

    res.status(200).json({ 
      status: true, 
      msg: "Artist updated successfully!", 
      data: updatedArtist 
    });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Update failed", error: error.message });
  }
};

// ==========================================
// 🔴 5. DELETE (LOCAL CLEANUP)
// ==========================================
export const deleteArtist = async (req, res) => {
  try {
    const { id } = req.params;
    const artist = await Artist.findById(id);

    if (!artist) {
      return res.status(404).json({ status: false, msg: "Artist not found" });
    }

    // 🗑️ Delete Image from folder before removing record
    if (artist.picture) {
      await deleteFileLocal(artist.picture);
    }

    await Artist.findByIdAndDelete(id);

    res.status(200).json({ status: true, msg: "Artist deleted successfully!" });

  } catch (error) {
    res.status(500).json({ status: false, msg: "Delete failed", error: error.message });
  }
};