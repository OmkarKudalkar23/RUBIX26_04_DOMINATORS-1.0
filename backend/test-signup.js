const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSignup() {
  try {
    const response = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User 3',
        email: 'test3@example.com',
        password: 'password123',
        role: 'patient'
      }),
    });

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testSignup();