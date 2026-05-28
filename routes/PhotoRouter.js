const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "images"));
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || "");
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${extension}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// POST /photos/new
router.post("/new", upload.any(), async (req, res) => {
  const file = req.files && req.files[0];

  if (!file) {
    return res.status(400).json({ error: "No photo file uploaded" });
  }

  try {
    const photo = await Photo.create({
      file_name: file.filename,
      date_time: new Date(),
      user_id: req.session.user_id,
      comments: [],
    });

    return res.json({
      _id: photo._id,
      user_id: photo.user_id,
      file_name: photo.file_name,
      date_time: photo.date_time,
      comments: [],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/photo/photosOfUser/:id
router.get("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  try {
    const userExists = await User.findById(req.params.id);
    if (!userExists) return res.status(400).json({ error: "User not found" });

    const photos = await Photo.find({ user_id: req.params.id });

    const result = await Promise.all(
      photos.map(async (photo) => {
        const comments = await Promise.all(
          photo.comments.map(async (comment) => {
            const user = await User.findById(
              comment.user_id,
              "_id first_name last_name"
            );
            return {
              _id: comment._id,
              comment: comment.comment,
              date_time: comment.date_time,
              user,
            };
          })
        );
        return {
          _id: photo._id,
          user_id: photo.user_id,
          file_name: photo.file_name,
          date_time: photo.date_time,
          comments,
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
