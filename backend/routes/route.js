const express = require('express');
const axios = require('axios');

const router = express.Router();

// Fetch route using OSRM (no API key needed)
router.post('/', async (req, res) => {
  try {
    const { start, end, profile = 'driving' } = req.body;

    if (!start || !end || !Array.isArray(start) || !Array.isArray(end)) {
      return res.status(400).json({ 
        error: 'start and end coordinates are required as arrays [lat, lng]' 
      });
    }

    // OSRM expects coordinates as [lng, lat] (longitude first) in the URL
    // Format: /route/v1/{profile}/{coordinates}?overview=full&geometries=geojson
    // Coordinates format: lng1,lat1;lng2,lat2
    const url = `https://router.project-osrm.org/route/v1/${profile}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    const response = await axios.get(url);

    res.json(response.data);
  } catch (err) {
    console.error('Error fetching route from OSRM:', err.message || err);
    res.status(500).json({ 
      error: 'Failed to fetch route',
      message: err.message || 'Unknown error'
    });
  }
});

module.exports = router;

