// Simple test to verify frontend can communicate with backend
async function testApiConnection() {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test3@example.com',
        password: 'password123',
      }),
    });

    const data = await response.json();
    console.log('API Connection Test Result:', data);
    
    if (response.ok) {
      console.log('✅ Frontend successfully connected to backend API');
      return true;
    } else {
      console.log('❌ API returned error:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to connect to backend API:', error.message);
    return false;
  }
}

// Run the test
testApiConnection();