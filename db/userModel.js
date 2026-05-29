const mongoose = require("mongoose");

// User lưu thông tin hồ sơ, tên đăng nhập và mật khẩu theo yêu cầu Problem 4.
// Lưu ý: bài yêu cầu password là string; hệ thống thật nên dùng bcrypt để hash password.
const userSchema = new mongoose.Schema({
  first_name: { type: String },
  last_name: { type: String },
  location: { type: String },
  description: { type: String },
  occupation: { type: String },
  login_name: { type: String },
  password: { type: String },
});

// Dùng mongoose.models để tránh lỗi OverwriteModelError khi nodemon reload.
module.exports = mongoose.models.Users || mongoose.model("Users", userSchema);
