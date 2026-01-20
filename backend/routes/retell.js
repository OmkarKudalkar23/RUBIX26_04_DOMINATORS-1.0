const express = require('express');
const Retell = require('retell-sdk');
require('dotenv').config();

const router = express.Router();

// Initialize Retell client
const client = new Retell({
  apiKey: process.env.RETELL_API_KEY || "key_b659e34b73ebd3dbb8ddf1920db7",
});

// API to list calls
router.get('/calls', async (req, res) => {
  try {
    const calls = await client.call.list();
    res.json(calls);
  } catch (err) {
    console.error("Error fetching calls:", err);
    res.status(500).json({ error: "Failed to fetch calls", details: err.message });
  }
});

// API to make a call
router.post('/make-call', async (req, res) => {
  const { from_number, to_number } = req.body;

  if (!from_number || !to_number) {
    return res.status(400).json({ 
      success: false, 
      error: "from_number and to_number are required" 
    });
  }

  try {
    const phoneCallResponse = await client.call.createPhoneCall({
      from_number,
      to_number,
    });

    console.log('Call created successfully:', phoneCallResponse.call_id);
    res.json({ success: true, call: phoneCallResponse });
  } catch (error) {
    console.error("Error making call:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to make call" 
    });
  }
});

module.exports = router;

