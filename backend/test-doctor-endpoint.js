/**
 * Quick test script to verify doctor endpoints are accessible
 */

const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

async function testRoutes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test loading routes
    console.log('\n🔍 Testing route loading...');
    
    try {
      const doctorRoutes = require('./routes/doctor');
      console.log('✅ Doctor routes loaded');
      console.log('   Router type:', typeof doctorRoutes);
    } catch (error) {
      console.error('❌ Error loading doctor routes:', error.message);
      console.error(error.stack);
    }

    // Test loading server
    try {
      // Don't actually start the server, just test loading
      console.log('\n🔍 Testing server.js structure...');
      const fs = require('fs');
      const serverContent = fs.readFileSync('./server.js', 'utf8');
      
      if (serverContent.includes("app.use('/api/doctor'")) {
        console.log('✅ Server.js includes doctor route registration');
      } else {
        console.log('❌ Server.js does NOT include doctor route registration');
      }
      
      if (serverContent.includes("require('./routes/doctor')")) {
        console.log('✅ Server.js requires doctor routes');
      } else {
        console.log('❌ Server.js does NOT require doctor routes');
      }
    } catch (error) {
      console.error('❌ Error reading server.js:', error.message);
    }

    await mongoose.connection.close();
    console.log('\n✅ Test complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testRoutes();


