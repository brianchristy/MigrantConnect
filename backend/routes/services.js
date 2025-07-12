const express = require('express');
const router = express.Router();
const axios = require('axios');

// OpenStreetMap Overpass API - Completely free, no API key needed
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

// Test endpoint to verify OSM API
router.get('/healthcare/test', async (req, res) => {
  try {
    // Test with a simple search in Trivandrum
    const testQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](around:5000,8.5157514,76.9856155);
        node["amenity"="clinic"](around:5000,8.5157514,76.9856155);
        node["amenity"="pharmacy"](around:5000,8.5157514,76.9856155);
      );
      out body;
    `;
    
    const response = await axios.get(`${OVERPASS_API_URL}?data=${encodeURIComponent(testQuery)}`);
    
    res.json({ 
      message: 'OSM API test successful',
      elementsFound: response.data.elements?.length || 0,
      status: 'working'
    });
  } catch (err) {
    console.error('OSM API test error:', err);
    res.status(500).json({ 
      error: 'OSM API test failed',
      details: err.response?.data || err.message
    });
  }
});

// Find nearby healthcare services using OpenStreetMap Overpass API
router.get('/healthcare/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Build Overpass query for healthcare facilities
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](around:${radius},${latitude},${longitude});
        node["amenity"="clinic"](around:${radius},${latitude},${longitude});
        node["amenity"="pharmacy"](around:${radius},${latitude},${longitude});
        node["amenity"="doctors"](around:${radius},${latitude},${longitude});
        node["healthcare"="hospital"](around:${radius},${latitude},${longitude});
        node["healthcare"="clinic"](around:${radius},${latitude},${longitude});
        node["healthcare"="pharmacy"](around:${radius},${latitude},${longitude});
        way["amenity"="hospital"](around:${radius},${latitude},${longitude});
        way["amenity"="clinic"](around:${radius},${latitude},${longitude});
        way["amenity"="pharmacy"](around:${radius},${latitude},${longitude});
        way["amenity"="doctors"](around:${radius},${latitude},${longitude});
        way["healthcare"="hospital"](around:${radius},${latitude},${longitude});
        way["healthcare"="clinic"](around:${radius},${latitude},${longitude});
        way["healthcare"="pharmacy"](around:${radius},${latitude},${longitude});
      );
      out body;
      >>;
      out skel qt;
    `;

    const response = await axios.get(`${OVERPASS_API_URL}?data=${encodeURIComponent(query)}`);

    if (!response.data.elements || response.data.elements.length === 0) {
      const mockServices = generateMockHealthcareServices(latitude, longitude);
      return res.json({ services: mockServices });
    }

    // Process OSM data into our format
    const services = response.data.elements
      .filter(element => element.type === 'node' || element.type === 'way')
      .map(element => {
        const lat = element.lat || element.center?.lat;
        const lng = element.lon || element.center?.lon;
        
        if (!lat || !lng) return null;

        const name = element.tags?.name || 
                   element.tags?.['name:en'] || 
                   element.tags?.['name:hi'] || 
                   `${getHealthcareTypeName(element.tags)}`;
        
        const address = element.tags?.['addr:street'] || 
                       element.tags?.['addr:full'] || 
                       'Address not available';
        
        const healthcareType = getHealthcareType(element.tags);
        const distance = calculateDistance(latitude, longitude, lat, lng);

        return {
          id: `${element.type}_${element.id}`,
          name: name,
          address: address,
          rating: null, // OSM doesn't provide ratings
          userRatingsTotal: null,
          types: [healthcareType],
          location: { lat, lng },
          distance: distance,
          osmData: element // Keep original OSM data for reference
        };
      })
      .filter(service => service !== null)
      .sort((a, b) => a.distance - b.distance); // Sort by distance

    res.json({ services });
  } catch (err) {
    console.error('Healthcare services error:', err);
    
    // Fallback to mock data if OSM API fails
    const mockServices = generateMockHealthcareServices(latitude, longitude);
    res.json({ services: mockServices });
  }
});

// Helper function to determine healthcare type from OSM tags
function getHealthcareType(tags) {
  if (tags?.amenity === 'hospital' || tags?.healthcare === 'hospital') return 'hospital';
  if (tags?.amenity === 'clinic' || tags?.healthcare === 'clinic') return 'clinic';
  if (tags?.amenity === 'pharmacy' || tags?.healthcare === 'pharmacy') return 'pharmacy';
  if (tags?.amenity === 'doctors') return 'clinic';
  return 'healthcare';
}

// Helper function to get readable healthcare type name
function getHealthcareTypeName(tags) {
  const type = getHealthcareType(tags);
  switch (type) {
    case 'hospital': return 'Hospital';
    case 'clinic': return 'Medical Clinic';
    case 'pharmacy': return 'Pharmacy';
    default: return 'Healthcare Facility';
  }
}

// Generate mock healthcare services for demo
function generateMockHealthcareServices(latitude, longitude) {
  const mockServices = [
    {
      id: 'mock_hospital_1',
      name: 'City General Hospital',
      address: '123 Main Street, Trivandrum, Kerala',
      rating: 4.5,
      userRatingsTotal: 150,
      types: ['hospital', 'health'],
      location: {
        lat: parseFloat(latitude) + 0.001,
        lng: parseFloat(longitude) + 0.001
      },
      distance: calculateDistance(latitude, longitude, parseFloat(latitude) + 0.001, parseFloat(longitude) + 0.001)
    },
    {
      id: 'mock_clinic_1',
      name: 'Community Health Clinic',
      address: '456 Health Avenue, Trivandrum, Kerala',
      rating: 4.2,
      userRatingsTotal: 89,
      types: ['health', 'establishment'],
      location: {
        lat: parseFloat(latitude) - 0.002,
        lng: parseFloat(longitude) + 0.002
      },
      distance: calculateDistance(latitude, longitude, parseFloat(latitude) - 0.002, parseFloat(longitude) + 0.002)
    },
    {
      id: 'mock_pharmacy_1',
      name: 'MedPlus Pharmacy',
      address: '789 Medical Road, Trivandrum, Kerala',
      rating: 4.0,
      userRatingsTotal: 67,
      types: ['pharmacy', 'health'],
      location: {
        lat: parseFloat(latitude) + 0.003,
        lng: parseFloat(longitude) - 0.001
      },
      distance: calculateDistance(latitude, longitude, parseFloat(latitude) + 0.003, parseFloat(longitude) - 0.001)
    },
    {
      id: 'mock_hospital_2',
      name: 'Specialty Medical Center',
      address: '321 Care Boulevard, Trivandrum, Kerala',
      rating: 4.7,
      userRatingsTotal: 203,
      types: ['hospital', 'health'],
      location: {
        lat: parseFloat(latitude) - 0.001,
        lng: parseFloat(longitude) - 0.003
      },
      distance: calculateDistance(latitude, longitude, parseFloat(latitude) - 0.001, parseFloat(longitude) - 0.003)
    }
  ];
  
  return mockServices;
}

// Get service details (for OSM data, we return basic info since detailed data isn't available)
router.get('/healthcare/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    
    // For OSM data, we don't have detailed place information like Google Places
    // Return basic service information
    const service = {
      id: placeId,
      name: 'Healthcare Facility',
      address: 'Address information available in main listing',
      phone: 'Contact information not available',
      website: null,
      openingHours: null,
      rating: null,
      userRatingsTotal: null
    };
    
    res.json({ service });
  } catch (err) {
    console.error('Service details error:', err);
    res.status(500).json({ error: 'Failed to fetch service details' });
  }
});

// Book appointment (mock implementation for demo)
router.post('/healthcare/book', async (req, res) => {
  try {
    const { serviceId, serviceName, appointmentDate, appointmentTime, userPhone, userName } = req.body;
    
    // Mock booking - in real app, save to database
    const booking = {
      id: Date.now().toString(),
      serviceId,
      serviceName,
      appointmentDate,
      appointmentTime,
      userPhone,
      userName,
      status: 'confirmed',
      bookingDate: new Date().toISOString()
    };

    res.json({ 
      message: 'Appointment booked successfully!',
      booking 
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// Get user's bookings
router.get('/healthcare/bookings/:userPhone', async (req, res) => {
  try {
    const { userPhone } = req.params;
    
    // Mock bookings - in real app, fetch from database
    const bookings = [
      {
        id: '1',
        serviceName: 'City Hospital',
        appointmentDate: '2024-01-15',
        appointmentTime: '10:00 AM',
        status: 'confirmed'
      }
    ];

    res.json({ bookings });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

module.exports = router;
