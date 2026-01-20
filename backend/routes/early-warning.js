const express = require('express');
const router = express.Router();
const axios = require('axios');

// Early Warning System API base URL (FastAPI service)
const EARLY_WARNING_API_URL = process.env.EARLY_WARNING_API_URL || 'http://localhost:8001';

// Axios client with a sane timeout so a down ML service doesn't hang the UI
const ewClient = axios.create({
  baseURL: EARLY_WARNING_API_URL,
  timeout: 8000, // 8s
});

// If the ML service is down/unreachable, return a safe 200 response so the frontend doesn't spam 500s.
// (The UI already handles "NORMAL"/empty responses gracefully.)
const isUpstreamUnreachable = (error) => {
  const code = error?.code;
  return (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT'
  );
};

const safeErrorDetails = (error) => ({
  message: error?.message || 'Unknown error',
  code: error?.code,
  upstreamStatus: error?.response?.status,
});

/**
 * GET /api/early-warning/health
 * Health check for early warning service
 */
router.get('/health', async (req, res) => {
  try {
    const response = await ewClient.get(`/health`);
    res.json(response.data);
  } catch (error) {
    console.error('Early warning health check error:', error.message);
    // Keep status 200 so frontend doesn't show 500 noise if ML service isn't running.
    // Still provide a clear payload.
    res.status(200).json({
      status: 'unhealthy',
      service: 'Early Warning System',
      error: safeErrorDetails(error),
    });
  }
});

/**
 * GET /api/early-warning/cities
 * Get list of supported cities
 */
router.get('/cities', async (req, res) => {
  try {
    const response = await ewClient.get(`/cities`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching cities:', error.message);
    if (isUpstreamUnreachable(error)) {
      return res.status(200).json({ cities: [], count: 0, status: 'unavailable' });
    }
    res.status(200).json({ cities: [], count: 0, status: 'error', error: safeErrorDetails(error) });
  }
});

/**
 * POST /api/early-warning/early-warning
 * Get complete early warning analysis for a city
 */
router.post('/early-warning', async (req, res) => {
  try {
    const { city, date } = req.body;
    
    if (!city) {
      return res.status(400).json({ error: 'City is required' });
    }

    const response = await ewClient.post(`/early-warning`, {
      city: city,
      date: date || null
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error getting early warning:', error.message);
    if (isUpstreamUnreachable(error)) {
      return res.status(200).json({
        status: 'unavailable',
        city: req.body?.city,
        timestamp: new Date().toISOString(),
        alert: {
          alert_level: 'NORMAL',
          message: 'Early warning service is not running. Start the ML service on port 8001 to enable forecasts.',
          recommendations: [],
          metrics: { total_anomalies: 0, max_spike_percentage: 0, forecast_increase_percentage: 0 },
        },
      });
    }

    // Non-network errors: still keep 200 for UI stability, but return details for debugging.
    return res.status(200).json({
      status: 'error',
      city: req.body?.city,
      timestamp: new Date().toISOString(),
      alert: {
        alert_level: 'NORMAL',
        message: 'Early warning service error (see details).',
        recommendations: [],
        metrics: { total_anomalies: 0, max_spike_percentage: 0, forecast_increase_percentage: 0 },
      },
      error: safeErrorDetails(error),
    });
  }
});

/**
 * GET /api/early-warning/early-warning/:city
 * Quick early warning check for a city
 */
router.get('/early-warning/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { date } = req.query;

    const params = date ? { date } : {};
    const response = await ewClient.get(`/early-warning/${city}`, { params });
    res.json(response.data);
  } catch (error) {
    console.error('Error getting quick early warning:', error.message);
    if (isUpstreamUnreachable(error)) {
      return res.status(200).json({
        status: 'unavailable',
        city: req.params.city,
        timestamp: new Date().toISOString(),
        alert_level: 'NORMAL',
        message: 'Early warning service is not running. Start the ML service on port 8001 to enable forecasts.',
        total_anomalies: 0,
        max_spike_percentage: 0,
        forecast_increase_percentage: 0,
        recommendations: [],
      });
    }

    return res.status(200).json({
      status: 'error',
      city: req.params.city,
      timestamp: new Date().toISOString(),
      alert_level: 'NORMAL',
      message: 'Early warning service error (see details).',
      total_anomalies: 0,
      max_spike_percentage: 0,
      forecast_increase_percentage: 0,
      recommendations: [],
      error: safeErrorDetails(error),
    });
  }
});

/**
 * GET /api/early-warning/signals/:city
 * Get current early signals for a city
 */
router.get('/signals/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { date } = req.query;

    const params = date ? { date } : {};

    const response = await ewClient.get(`/signals/${city}`, { params });
    res.json(response.data);
  } catch (error) {
    console.error('Error getting signals:', error.message);
    if (isUpstreamUnreachable(error)) {
      return res.status(200).json({ status: 'unavailable', city: req.params.city, signals: [] });
    }
    return res.status(200).json({ status: 'error', city: req.params.city, signals: [], error: safeErrorDetails(error) });
  }
});

/**
 * GET /api/early-warning/forecast/:city
 * Get forecast data for a city
 */
router.get('/forecast/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { days } = req.query;

    const params = days ? { days: parseInt(days) } : {};

    const response = await ewClient.get(`/forecast/${city}`, { params });
    res.json(response.data);
  } catch (error) {
    console.error('Error getting forecast:', error.message);
    if (isUpstreamUnreachable(error)) {
      return res.status(200).json({ status: 'unavailable', city: req.params.city, forecast: [] });
    }
    return res.status(200).json({ status: 'error', city: req.params.city, forecast: [], error: safeErrorDetails(error) });
  }
});

/**
 * GET /api/early-warning/hospital-load/:city
 * Get hospital load forecast for a city
 */
router.get('/hospital-load/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { disease_type } = req.query;

    const params = disease_type ? { disease_type } : {};

    const response = await ewClient.get(`/hospital-load/${city}`, { params });
    res.json(response.data);
  } catch (error) {
    console.error('Error getting hospital load:', error.message);
    if (isUpstreamUnreachable(error)) {
      return res.status(200).json({
        status: 'unavailable',
        city: req.params.city,
        message: 'Early warning service is not running. Start the ML service on port 8001 to enable hospital load forecasts.',
        hospital_load: null,
      });
    }

    return res.status(200).json({
      status: 'error',
      city: req.params.city,
      message: 'Early warning service error (see details).',
      hospital_load: null,
      error: safeErrorDetails(error),
    });
  }
});

/**
 * GET /api/early-warning/anomalies/:city
 * Get anomaly detection results for a city
 */
router.get('/anomalies/:city', async (req, res) => {
  try {
    const { city } = req.params;

    const response = await ewClient.get(`/anomalies/${city}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error getting anomalies:', error.message);
    if (isUpstreamUnreachable(error)) {
      return res.status(200).json({ status: 'unavailable', city: req.params.city, anomalies: [] });
    }
    return res.status(200).json({ status: 'error', city: req.params.city, anomalies: [], error: safeErrorDetails(error) });
  }
});

module.exports = router;

