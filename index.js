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

dbConnect();

const isProduction = process.env.NODE_ENV === "production";
const frontendOrigin = process.env.FRONTEND_ORIGIN;
const cookieSameSite = process.env.COOKIE_SAMESITE || (isProduction ? "none" : "lax");
const cookieSecure =
  process.env.COOKIE_SECURE === "true" || cookieSameSite === "none";

app.set("trust proxy", 1);

app.use(
  cors({
    origin: frontendOrigin ? frontendOrigin.split(",") : true,
    credentials: true,
  })
);
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "photo-sharing-app-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: cookieSameSite,
      secure: cookieSecure,
    },
  })
);

function requireLogin(req, res, next) {
  if (!req.session || !req.session.user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}

app.use("/admin", AdminRouter);
app.use("/user", (req, res, next) => {
  if (req.method === "POST" && req.path === "/") {
    return UserRouter(req, res, next);
  }
  return next();
});
app.use(requireLogin);
app.use("/user", UserRouter);
app.use("/photos", PhotoRouter);
app.use("/photosOfUser", PhotoRouter);
app.use("/commentsOfPhoto", CommentRouter);

app.get("/", (request, response) => {
  response.send({ message: "Hello from photo-sharing app API!" });
});

app.listen(8081, () => {
  console.log("server listening on port 8081");
});
