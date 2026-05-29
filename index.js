const express = require("express");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const dbConnect = require("./db/dbConnect");
const AdminRouter = require("./routes/AdminRouter");
const CommentRouter = require("./routes/CommentRouter");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");

const app = express();

// Kết nối MongoDB Atlas trước khi nhận request.
dbConnect();

// Các biến này giúp app chạy được cả local và khi deploy CodeSandbox/HTTPS.
const isProduction = process.env.NODE_ENV === "production";
const frontendOrigin = process.env.FRONTEND_ORIGIN;
const cookieSameSite = process.env.COOKIE_SAMESITE || (isProduction ? "none" : "lax");
const cookieSecure =
  process.env.COOKIE_SECURE === "true" || cookieSameSite === "none";

// Cần trust proxy để cookie secure hoạt động đúng khi app nằm sau proxy của CodeSandbox.
app.set("trust proxy", 1);

app.use(
  cors({
    // Nếu có FRONTEND_ORIGIN thì chỉ cho frontend đó gọi API; nếu không thì cho phép theo origin request.
    origin: frontendOrigin ? frontendOrigin.split(",") : true,
    // Bắt buộc để trình duyệt gửi cookie session khi gọi fetch(..., credentials: "include").
    credentials: true,
  })
);

// Cho phép server đọc JSON body trong các request login, register, comment.
app.use(express.json());

// Cho phép frontend load ảnh upload bằng URL /images/<file_name>.
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "photo-sharing-app-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      // Local dùng lax/false; deploy HTTPS khác domain dùng none/true.
      sameSite: cookieSameSite,
      secure: cookieSecure,
    },
  })
);

// Middleware bảo vệ API: route nào đặt sau requireLogin thì phải đăng nhập mới gọi được.
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}

// /admin/login và /admin/logout không bị chặn bởi requireLogin.
app.use("/admin", AdminRouter);

// Đăng ký tài khoản mới là route public nên phải đặt trước requireLogin.
app.use("/user", (req, res, next) => {
  if (req.method === "POST" && req.path === "/") {
    return UserRouter(req, res, next);
  }
  return next();
});

// Từ dòng này trở xuống, tất cả API đều yêu cầu user đã login.
app.use(requireLogin);
app.use("/user", UserRouter);
// /photos/new dùng upload ảnh; /photosOfUser/:id dùng xem ảnh của user.
app.use("/photos", PhotoRouter);
app.use("/photosOfUser", PhotoRouter);
app.use("/commentsOfPhoto", CommentRouter);

app.get("/", (request, response) => {
  response.send({ message: "Hello from photo-sharing app API!" });
});

app.listen(8081, () => {
  console.log("server listening on port 8081");
});
