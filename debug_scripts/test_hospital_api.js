const fetch = require('node-fetch');

async function testApi() {
    try {
        const response = await fetch('http://localhost:5000/api/hospitals/capacity');
        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            return;
        }
        const data = await response.json();
        console.log("City Summary:", JSON.stringify(data.citySummary, null, 2));
        if (data.hospitals && data.hospitals.length > 0) {
            console.log("First Hospital Sample:", JSON.stringify(data.hospitals[0], null, 2));
        } else {
            console.log("No hospitals found.");
        }
    } catch (error) {
        console.error("Fetch failed:", error);
    }
}

testApi();
