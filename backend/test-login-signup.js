// Quick test script for login and signup
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testLoginSignup() {
  console.log('🧪 Testing Login and Signup...\n');

  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'test123456';
  const testName = 'Test User';

  // Test 1: Signup
  console.log('1. Testing Signup...');
  try {
    const signupResponse = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
        role: 'patient'
      })
    });
    
    const signupData = await signupResponse.json();
    console.log('   Status:', signupResponse.status);
    console.log('   Response:', JSON.stringify(signupData, null, 2));
    
    if (signupResponse.ok) {
      console.log('   ✅ Signup successful!');
      console.log('   User ID:', signupData.user.id);
      console.log('   Token received:', !!signupData.token);
      
      // Test 2: Login with correct credentials
      console.log('\n2. Testing Login with correct credentials...');
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });
      
      const loginData = await loginResponse.json();
      console.log('   Status:', loginResponse.status);
      console.log('   Response:', JSON.stringify(loginData, null, 2));
      
      if (loginResponse.ok) {
        console.log('   ✅ Login successful!');
        console.log('   Patient ID:', loginData.user.patientId || 'Not set (profile not created)');
      } else {
        console.log('   ❌ Login failed:', loginData.message);
      }
      
      // Test 3: Login with wrong password
      console.log('\n3. Testing Login with wrong password...');
      const wrongLoginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'wrongpassword'
        })
      });
      
      const wrongLoginData = await wrongLoginResponse.json();
      if (!wrongLoginResponse.ok) {
        console.log('   ✅ Correctly rejected wrong password:', wrongLoginData.message);
      } else {
        console.log('   ❌ Wrong password was accepted (should be rejected)');
      }
      
    } else {
      console.log('   ❌ Signup failed:', signupData.message);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    console.log('   Make sure the backend server is running on http://localhost:5000');
  }

  console.log('\n✨ Testing complete!');
}

testLoginSignup().catch(console.error);

