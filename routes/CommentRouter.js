const express = require("express");
const mongoose = require("mongoose");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");

const router = express.Router();

router.post("/:photo_id", async (req, res) => {
  const { photo_id: photoId } = req.params;
  const commentText = req.body && req.body.comment;

  if (!mongoose.Types.ObjectId.isValid(photoId)) {
    return res.status(400).json({ error: "Invalid photo ID" });
  }

  if (!commentText || !commentText.trim()) {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  try {
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(400).json({ error: "Photo not found" });
    }

    const user = await User.findById(
      req.session.user_id,
      "_id first_name last_name"
    );
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const newComment = {
      comment: commentText.trim(),
      date_time: new Date(),
      user_id: user._id,
    };

    photo.comments.push(newComment);
    await photo.save();

    const savedComment = photo.comments[photo.comments.length - 1];
    return res.json({
      _id: savedComment._id,
      comment: savedComment.comment,
      date_time: savedComment.date_time,
      user,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
