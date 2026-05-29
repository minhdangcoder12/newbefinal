const express = require("express");
const mongoose = require("mongoose");
const User = require("../db/userModel");
const Photo = require("../db/photoModel");

const router = express.Router();

// Chuẩn hóa object user trả về client, không bao giờ gửi password.
function publicUser(user) {
  return {
    _id: user._id,
    login_name: user.login_name,
    first_name: user.first_name,
    last_name: user.last_name,
    location: user.location,
    description: user.description,
    occupation: user.occupation,
  };
}

// POST /user: đăng ký tài khoản mới. Route này public nên được mount trước requireLogin trong index.js.
router.post("/", async (req, res) => {
  const {
    login_name: loginName,
    password,
    first_name: firstName,
    last_name: lastName,
    location,
    description,
    occupation,
  } = req.body || {};

  // Các field bắt buộc theo đề bài: login_name, password, first_name, last_name.
  if (!loginName || !loginName.trim()) {
    return res.status(400).send("login_name is required");
  }
  if (!password || !password.trim()) {
    return res.status(400).send("password is required");
  }
  if (!firstName || !firstName.trim()) {
    return res.status(400).send("first_name is required");
  }
  if (!lastName || !lastName.trim()) {
    return res.status(400).send("last_name is required");
  }

  try {
    // Không cho đăng ký trùng login_name.
    const existingUser = await User.findOne({ login_name: loginName.trim() });
    if (existingUser) {
      return res.status(400).send("login_name already exists");
    }

    // Lưu password dạng text theo yêu cầu bài; thực tế production nên hash password.
    const user = await User.create({
      login_name: loginName.trim(),
      password,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      location: location || "",
      description: description || "",
      occupation: occupation || "",
    });

    return res.json(publicUser(user));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /user/list: trả danh sách user cho sidebar bên trái.
router.get("/list", async (req, res) => {
  try {
    const users = await User.find({}, "_id first_name last_name");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /user/counts: thống kê số ảnh và số comment của từng user.
// Route cụ thể phải đặt trước /:id, nếu không Express sẽ hiểu "counts" là id.
router.get("/counts", async (req, res) => {
  try {
    const users = await User.find({}, "_id");
    const allPhotos = await Photo.find({});

    const counts = users.map((user) => {
      const userId = user._id.toString();

      const photoCount = allPhotos.filter(
        (p) => p.user_id.toString() === userId
      ).length;

      let commentCount = 0;
      allPhotos.forEach((photo) => {
        photo.comments.forEach((comment) => {
          if (comment.user_id.toString() === userId) commentCount++;
        });
      });

      return { _id: user._id, photoCount, commentCount };
    });

    res.json(counts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /user/userComments/:id: lấy tất cả comment do một user viết.
// Comment được nhúng trong từng photo, nên phải duyệt tất cả photo để tìm.
router.get("/userComments/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  try {
    const allPhotos = await Photo.find({});
    const result = [];

    allPhotos.forEach((photo) => {
      photo.comments.forEach((comment) => {
        if (comment.user_id.toString() === req.params.id) {
          result.push({
            comment: comment.comment,
            date_time: comment.date_time,
            _id: comment._id,
            photo: {
              _id: photo._id,
              file_name: photo.file_name,
              date_time: photo.date_time,
              user_id: photo.user_id,
            },
          });
        }
      });
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /user/:id: lấy thông tin chi tiết của một user.
// Đặt cuối cùng vì đây là route động.
router.get("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  try {
    const user = await User.findById(
      req.params.id,
      "_id first_name last_name location description occupation"
    );
    if (!user) return res.status(400).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
