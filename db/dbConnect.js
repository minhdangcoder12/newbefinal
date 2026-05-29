const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

async function dbConnect() {
  // Atlas dùng mongodb+srv; set DNS public giúp tránh lỗi querySrv trên một số môi trường.
  dns.setServers(["8.8.8.8", "1.1.1.1"]);

  // DB_URL lấy từ file .env hoặc environment variables trên CodeSandbox.
  mongoose
    .connect(process.env.DB_URL)
    .then(() => {
      console.log("Successfully connected to MongoDB Atlas!");
    })
    .catch((error) => {
      console.log("Unable to connect to MongoDB Atlas!");
      console.error(error);
    });
}

module.exports = dbConnect;
