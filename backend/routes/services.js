const express = require('express');
const router = express.Router();
const axios = require('axios');

// Google Places API key (you'll need to add this to your .env file)
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'YOUR_API_KEY';

// Test endpoint to verify API key
router.get('/healthcare/test', async (req, res) => {
  try {
    console.log('Testing Google Places API key...');
    console.log('API Key present:', !!GOOGLE_PLACES_API_KEY);
    console.log('API Key value:', GOOGLE_PLACES_API_KEY);
    
    // Test with a simple search
    const testResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=hospitals&location=12.9716,77.5946&radius=5000&key=${GOOGLE_PLACES_API_KEY}`
    );
    
    res.json({ 
      message: 'API key test successful',
      apiKeyPresent: !!GOOGLE_PLACES_API_KEY,
      testResults: testResponse.data.results?.length || 0
    });
  } catch (err) {
    console.error('API key test error:', err);
    res.status(500).json({ 
      error: 'API key test failed',
      details: err.response?.data || err.message
    });
  }
});

// Find nearby healthcare services
router.get('/healthcare/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    console.log('Fetching healthcare services for:', { latitude, longitude, radius });
    console.log('Using API key:', GOOGLE_PLACES_API_KEY ? 'Present' : 'Missing');

    // Check if billing is enabled by testing the API
    try {
      const apiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=health&keyword=hospital|clinic|pharmacy&key=${GOOGLE_PLACES_API_KEY}`;
      console.log('Google Places API URL:', apiUrl);

      const response = await axios.get(apiUrl);
      
      console.log('Google Places API response status:', response.status);
      console.log('Google Places API response data:', response.data);

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API error:', response.data);
        
        // If billing is not enabled, return mock data for demo
        if (response.data.status === 'REQUEST_DENIED' && response.data.error_message?.includes('Billing')) {
          console.log('Billing not enabled, returning mock data for demo');
          const mockServices = generateMockHealthcareServices(latitude, longitude);
          return res.json({ services: mockServices });
        }
        
        return res.status(500).json({ error: `Google Places API error: ${response.data.status}` });
      }

      const services = response.data.results.map(place => ({
        id: place.place_id,
        name: place.name,
        address: place.vicinity,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        types: place.types,
        location: place.geometry.location,
        distance: calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng)
      }));

      console.log('Processed services:', services.length);
      res.json({ services });
    } catch (apiError) {
      console.error('Google Places API error:', apiError.response?.data || apiError.message);
      
      // If API fails, return mock data for demo
      console.log('API failed, returning mock data for demo');
      const mockServices = generateMockHealthcareServices(latitude, longitude);
      res.json({ services: mockServices });
    }
  } catch (err) {
    console.error('Healthcare services error:', err);
    console.error('Error details:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch healthcare services' });
  }
});

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

// Get service details
router.get('/healthcare/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,opening_hours,rating,user_ratings_total,website&key=${GOOGLE_PLACES_API_KEY}`
    );

    const service = response.data.result;
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

    console.log('Appointment booked:', booking);
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
