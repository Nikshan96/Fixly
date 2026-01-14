const { sequelize, syncAndSeed } = require("../models");

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await syncAndSeed();
    console.log("✅ PostgreSQL connected");
  } catch (err) {
    console.error("❌ PostgreSQL connection error:", err.message);
  }
};

module.exports = connectDB;
