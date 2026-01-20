/**
 * Test script to verify backend endpoints are working
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Test endpoints
const endpoints = [
  { path: '/', method: 'GET', auth: false },
  { path: '/api/auth/login', method: 'POST', auth: false, body: { email: 'doctor@test.com', password: 'Password@123' } },
  { path: '/api/doctor/me', method: 'GET', auth: true },
  { path: '/api/doctor/me/appointments', method: 'GET', auth: true },
  { path: '/api/doctor/alerts', method: 'GET', auth: true },
];

async function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + endpoint.path);
    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (endpoint.auth) {
      // We'll need a token for this - skip for now
      options.headers['Authorization'] = 'Bearer test-token';
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data.substring(0, 200) // First 200 chars
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (endpoint.body) {
      req.write(JSON.stringify(endpoint.body));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Backend Endpoints\n');
  console.log('='.repeat(50));

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing: ${endpoint.method} ${endpoint.path}`);
      const result = await testEndpoint(endpoint);
      
      if (result.status === 404) {
        console.log(`   ❌ 404 Not Found - Route not registered`);
      } else if (result.status === 401) {
        console.log(`   ⚠️  401 Unauthorized - Route exists but needs auth`);
      } else if (result.status === 200 || result.status === 201) {
        console.log(`   ✅ ${result.status} OK - Route is working!`);
      } else {
        console.log(`   ⚠️  ${result.status} - Route exists but returned error`);
      }
      
      if (result.body.includes('Cannot GET') || result.body.includes('Cannot POST')) {
        console.log(`   ❌ Route handler not found`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ Connection refused - Server is NOT running on port 5000`);
        console.log(`   💡 Start the server with: npm start`);
      } else {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n📝 Summary:');
  console.log('   - If you see 404: Routes are not registered (restart server)');
  console.log('   - If you see 401: Routes work but need authentication');
  console.log('   - If you see ECONNREFUSED: Server is not running');
}

runTests();
