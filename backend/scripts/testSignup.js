/**
 * Simple script to test the /api/auth/signup endpoint.
 * Usage: node scripts/testSignup.js
 */

const SIGNUP_URL = process.env.SIGNUP_URL || "http://localhost:5000/api/auth/signup";

async function main() {
  const email = `testsignup_${Date.now()}@example.com`;
  const payload = {
    name: "Test Signup",
    email,
    password: "Password@123",
    role: "patient",
  };

  console.log("POST", SIGNUP_URL);
  console.log("payload:", payload);

  const res = await fetch(SIGNUP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log("status:", res.status);
  console.log("body:", text);
}

main().catch((e) => {
  console.error("testSignup failed:", e);
  process.exit(1);
});

