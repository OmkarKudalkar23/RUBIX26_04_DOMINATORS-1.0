/**
 * Check if server has doctor routes loaded
 */

const http = require('http');

console.log('🔍 Checking server status...\n');

// Test basic endpoint
const testBasic = () => {
  return new Promise((resolve) => {
    http.get('http://localhost:5000/', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Server is running on port 5000');
          resolve(true);
        } else {
          console.log('⚠️  Server responded with:', res.statusCode);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.log('❌ Server is NOT running on port 5000');
        console.log('   Start it with: npm start');
      } else {
        console.log('❌ Error:', err.message);
      }
      resolve(false);
    });
  });
};

// Test doctor route
const testDoctorRoute = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/doctor/me',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 404) {
          console.log('❌ Doctor routes are NOT registered (404)');
          console.log('   The server needs to be restarted!');
          console.log('\n   Steps to fix:');
          console.log('   1. Stop the current server (Ctrl+C)');
          console.log('   2. Run: npm start');
          console.log('   3. Look for: "✅ Doctor routes registered" in console');
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          console.log('✅ Doctor routes ARE registered!');
          console.log(`   Got ${res.statusCode} (auth required, which is correct)`);
        } else {
          console.log(`⚠️  Unexpected status: ${res.statusCode}`);
        }
        resolve(res.statusCode !== 404);
      });
    });

    req.on('error', (err) => {
      console.log('❌ Error testing route:', err.message);
      resolve(false);
    });

    req.end();
  });
};

async function check() {
  const serverRunning = await testBasic();
  if (serverRunning) {
    console.log('');
    await testDoctorRoute();
  }
  console.log('');
}

check();


