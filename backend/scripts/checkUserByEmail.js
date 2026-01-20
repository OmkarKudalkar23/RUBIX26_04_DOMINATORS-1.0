/**
 * Check whether a User exists by email in MongoDB.
 * Usage: node scripts/checkUserByEmail.js testsignup@example.com
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

async function main() {
  const email = (process.argv[2] || "").trim().toLowerCase();
  if (!email) {
    console.error("Please provide an email: node scripts/checkUserByEmail.js someone@example.com");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const user = await User.findOne({ email });
  if (!user) {
    console.log("NOT_FOUND", email);
    return;
  }

  console.log("FOUND", {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    patientId: user.patientId ? user.patientId.toString() : null,
    doctorId: user.doctorId ? user.doctorId.toString() : null,
    hospitalId: user.hospitalId ? user.hospitalId.toString() : null,
    createdAt: user.createdAt,
  });
}

main()
  .catch((e) => {
    console.error("checkUserByEmail failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {}
  });

