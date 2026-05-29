const express = require("express");
const mongoose = require("mongoose");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");

const router = express.Router();

// POST /commentsOfPhoto/:photo_id: thêm comment vào photo cụ thể.
router.post("/:photo_id", async (req, res) => {
  const { photo_id: photoId } = req.params;
  const commentText = req.body && req.body.comment;

  // Validate ObjectId để tránh query MongoDB với id sai định dạng.
  if (!mongoose.Types.ObjectId.isValid(photoId)) {
    return res.status(400).json({ error: "Invalid photo ID" });
  }

  // Theo đề bài, comment rỗng phải trả 400 Bad Request.
  if (!commentText || !commentText.trim()) {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  try {
    // Tìm photo trước, vì comment được lưu nhúng trong mảng comments của photo.
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(400).json({ error: "Photo not found" });
    }

    // Lấy user đang login từ session để gắn đúng tác giả comment.
    const user = await User.findById(
      req.session.user_id,
      "_id first_name last_name"
    );
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Mỗi comment cần nội dung, thời điểm tạo và id của user đang đăng nhập.
    const newComment = {
      comment: commentText.trim(),
      date_time: new Date(),
      user_id: user._id,
    };

    // Push vào mảng comments rồi save lại document photo.
    photo.comments.push(newComment);
    await photo.save();

    // Trả về comment mới kèm user để frontend append ngay, không cần reload toàn trang.
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
