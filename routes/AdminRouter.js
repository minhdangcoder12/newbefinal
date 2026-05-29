const express = require("express");
const User = require("../db/userModel");

const router = express.Router();

// Chỉ trả về các field frontend cần, tuyệt đối không trả password về client.
function sessionUser(user) {
  return {
    _id: user._id,
    first_name: user.first_name,
    last_name: user.last_name,
    login_name: user.login_name,
  };
}

// POST /admin/login: kiểm tra login_name + password, sau đó lưu user_id vào session.
router.post("/login", async (req, res) => {
  const loginName = req.body && req.body.login_name;
  const password = req.body && req.body.password;

  if (!loginName) {
    return res.status(400).json({ error: "Missing login_name" });
  }

  if (!password) {
    return res.status(400).json({ error: "Missing password" });
  }

  try {
    // Cho phép login bằng login_name; dòng first_name giữ để tài khoản tên tiếng Việt của bạn vẫn login được.
    const user = await User.findOne({
      $or: [{ login_name: loginName }, { first_name: loginName }],
    });
    if (!user) {
      return res.status(400).json({ error: "Invalid login_name" });
    }

    if (user.password !== password) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Đây là phần quan trọng nhất của login: session lưu user_id để các API sau biết ai đang đăng nhập.
    req.session.user_id = user._id.toString();
    return res.json(sessionUser(user));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /admin/logout: xóa session trên server và xóa cookie session trên browser.
router.post("/logout", (req, res) => {
  if (!req.session || !req.session.user_id) {
    return res.status(400).json({ error: "No user is logged in" });
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.clearCookie("connect.sid").json({ message: "Logged out" });
  });
});

module.exports = router;
