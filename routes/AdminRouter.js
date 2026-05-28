const express = require("express");
const User = require("../db/userModel");

const router = express.Router();

function sessionUser(user) {
  return {
    _id: user._id,
    first_name: user.first_name,
    last_name: user.last_name,
    login_name: user.login_name,
  };
}

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
    const user = await User.findOne({
      $or: [{ login_name: loginName }, { first_name: loginName }],
    });
    if (!user) {
      return res.status(400).json({ error: "Invalid login_name" });
    }

    if (user.password !== password) {
      return res.status(400).json({ error: "Invalid password" });
    }

    req.session.user_id = user._id.toString();
    return res.json(sessionUser(user));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

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
