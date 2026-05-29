const mongoose = require("mongoose");

// Comment là subdocument nằm bên trong một Photo, không có collection riêng.
const commentSchema = new mongoose.Schema({
  // Nội dung comment.
  comment: String,
  // Thời điểm comment được tạo.
  date_time: { type: Date, default: Date.now },
  // ID của user tạo comment.
  user_id: mongoose.Schema.Types.ObjectId,
});

// Photo lưu tên file ảnh, chủ sở hữu ảnh và danh sách comment.
const photoSchema = new mongoose.Schema({
  // Tên file ảnh trong thư mục images.
  file_name: { type: String },
  // Thời điểm ảnh được upload/thêm vào DB.
  date_time: { type: Date, default: Date.now },
  // ID của user sở hữu ảnh.
  user_id: mongoose.Schema.Types.ObjectId,
  // Các comment của ảnh này.
  comments: [commentSchema],
});

// Tạo model Photos để thao tác với collection photos.
const Photo = mongoose.model.Photos || mongoose.model("Photos", photoSchema);

module.exports = Photo;
