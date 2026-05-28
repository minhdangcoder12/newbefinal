const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

async function dbConnect() {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);

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
