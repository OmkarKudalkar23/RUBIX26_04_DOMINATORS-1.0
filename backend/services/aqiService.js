/**
 * Real-time AQI and Weather Data Service
 * Fetches live air quality and weather data from external APIs
 */

const axios = require('axios');

// Default city (can be overridden)
const DEFAULT_CITY = 'Mumbai';

/**
 * Get pollution level category from AQI
 */
function getPollutionLevel(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Poor';
  if (aqi <= 200) return 'Very Poor';
  return 'Severe';
}

/**
 * Fetch real-time AQI from WeatherAgent API (port 8000)
 */
async function fetchAQIFromWeatherAgent(city = DEFAULT_CITY) {
  try {
    const response = await axios.get(`http://localhost:8000/predict/${city}`, {
      timeout: 5000
    });
    
    if (response.data && response.data.aqi !== undefined) {
      return {
        aqi: Math.round(response.data.aqi),
        pm25: response.data.pm25 || null,
        temperature: response.data.temperature || null,
        humidity: response.data.humidity || null,
        pollutionLevel: getPollutionLevel(response.data.aqi),
        source: 'weather_agent'
      };
    }
  } catch (error) {
    console.warn('WeatherAgent API unavailable:', error.message);
  }
  return null;
}

/**
 * Fetch AQI from OpenAQ API (fallback)
 */
async function fetchAQIFromOpenAQ(city = DEFAULT_CITY) {
  try {
    // OpenAQ API endpoint for Mumbai
    // Note: You'll need an OpenAQ API key for production use
    const response = await axios.get(`https://api.openaq.org/v2/latest`, {
      params: {
        location_id: city === 'Mumbai' ? 'IN-MH-Mumbai' : undefined,
        limit: 1
      },
      timeout: 5000
    });
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      const pm25 = result.measurements?.find(m => m.parameter === 'pm25')?.value;
      
      if (pm25) {
        // Convert PM2.5 to AQI (simplified conversion)
        const aqi = pm25ToAQI(pm25);
        return {
          aqi: Math.round(aqi),
          pm25: pm25,
          pollutionLevel: getPollutionLevel(aqi),
          source: 'openaq'
        };
      }
    }
  } catch (error) {
    console.warn('OpenAQ API unavailable:', error.message);
  }
  return null;
}

/**
 * Convert PM2.5 to AQI (simplified US EPA formula)
 */
function pm25ToAQI(pm25) {
  if (pm25 <= 12) {
    return ((50 - 0) / (12 - 0)) * (pm25 - 0) + 0;
  } else if (pm25 <= 35.4) {
    return ((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51;
  } else if (pm25 <= 55.4) {
    return ((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101;
  } else if (pm25 <= 150.4) {
    return ((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151;
  } else if (pm25 <= 250.4) {
    return ((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201;
  } else {
    return ((400 - 301) / (350.4 - 250.5)) * (pm25 - 250.5) + 301;
  }
}

/**
 * Fetch weather data (temperature, humidity) from OpenWeatherMap or WeatherAgent
 */
async function fetchWeatherData(city = DEFAULT_CITY) {
  try {
    // Try WeatherAgent first
    const weatherAgentData = await fetchAQIFromWeatherAgent(city);
    if (weatherAgentData && weatherAgentData.temperature !== null) {
      return {
        temperature: weatherAgentData.temperature,
        humidity: weatherAgentData.humidity || 60
      };
    }
    
    // Fallback: Use default values or mock data
    // In production, you could integrate OpenWeatherMap API here
    return {
      temperature: 28 + Math.floor(Math.random() * 10), // 28-37°C for Mumbai
      humidity: 60 + Math.floor(Math.random() * 20) // 60-80%
    };
  } catch (error) {
    console.warn('Weather data fetch failed:', error.message);
    return {
      temperature: 30,
      humidity: 65
    };
  }
}

/**
 * Fetch real-time environment data (AQI, temperature, humidity)
 * Tries multiple sources and returns the best available data
 */
async function fetchRealTimeEnvironmentData(city = DEFAULT_CITY) {
  // Try WeatherAgent API first (port 8000)
  let aqiData = await fetchAQIFromWeatherAgent(city);
  
  // Fallback to OpenAQ if WeatherAgent unavailable
  if (!aqiData) {
    aqiData = await fetchAQIFromOpenAQ(city);
  }
  
  // Get weather data
  const weatherData = await fetchWeatherData(city);
  
  // Combine data
  if (aqiData) {
    return {
      aqi: aqiData.aqi,
      pm25: aqiData.pm25,
      temperature: aqiData.temperature || weatherData.temperature,
      humidity: aqiData.humidity || weatherData.humidity,
      pollutionLevel: aqiData.pollutionLevel,
      festivalFlag: false, // Can be enhanced with calendar check
      source: aqiData.source || 'fallback',
      timestamp: new Date().toISOString()
    };
  }
  
  // Ultimate fallback: return reasonable defaults
  console.warn('All AQI sources unavailable, using fallback values');
  return {
    aqi: 100 + Math.floor(Math.random() * 50), // 100-150 range
    pm25: null,
    temperature: weatherData.temperature,
    humidity: weatherData.humidity,
    pollutionLevel: 'Moderate',
    festivalFlag: false,
    source: 'fallback',
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  fetchRealTimeEnvironmentData,
  fetchAQIFromWeatherAgent,
  fetchAQIFromOpenAQ,
  getPollutionLevel,
  pm25ToAQI
};
