/**
 * Quick verification script - run this AFTER restarting the server
 * Usage: node verify-routes.js
 */

const http = require('http');

console.log('🔍 Verifying doctor routes are registered...\n');

const testRoute = (path, callback) => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: path,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token' // Will get 401, but that means route exists
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode === 404) {
        console.log(`❌ ${path} - Route NOT found (404)`);
        callback(false);
      } else if (res.statusCode === 401 || res.statusCode === 403) {
        console.log(`✅ ${path} - Route EXISTS (${res.statusCode} = needs auth, which is correct)`);
        callback(true);
      } else {
        console.log(`⚠️  ${path} - Status: ${res.statusCode}`);
        callback(res.statusCode !== 404);
      }
    });
  });

  req.on('error', (error) => {
    if (error.code === 'ECONNREFUSED') {
      console.log(`❌ ${path} - Server NOT running!`);
      console.log('   Start server with: npm start');
    } else {
      console.log(`❌ ${path} - Error: ${error.message}`);
    }
    callback(false);
  });

  req.end();
};

const routes = [
  '/api/doctor/me',
  '/api/doctor/me/appointments',
  '/api/doctor/alerts'
];

let allPassed = true;

routes.forEach((route, index) => {
  testRoute(route, (exists) => {
    if (!exists) allPassed = false;
    
    if (index === routes.length - 1) {
      console.log('\n' + '='.repeat(50));
      if (allPassed) {
        console.log('✅ All routes are registered!');
        console.log('✅ Backend is ready to use!');
      } else {
        console.log('❌ Some routes are missing!');
        console.log('💡 Make sure you restarted the server after adding routes');
      }
      process.exit(allPassed ? 0 : 1);
    }
  });
});


