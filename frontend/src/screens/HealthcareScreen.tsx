import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  Linking
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface Service {
  id: string;
  name: string;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
  location: {
    lat: number;
    lng: number;
  };
  distance: number;
}

export default function HealthcareScreen({ route, navigation }: any) {
  const user = route?.params?.user;
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to find nearby healthcare services.');
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      // Fetch nearby healthcare services
      await fetchNearbyServices(currentLocation.coords.latitude, currentLocation.coords.longitude);
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyServices = async (latitude: number, longitude: number) => {
    try {
      console.log('Fetching services for coordinates:', { latitude, longitude });
      console.log('API URL:', `${API_BASE_URL}/api/services/healthcare/nearby`);
      
      const response = await axios.get(`${API_BASE_URL}/api/services/healthcare/nearby`, {
        params: { latitude, longitude, radius: 5000 }
      });
      
      console.log('Services response:', response.data);
      setServices(response.data.services);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      Alert.alert('Error', `Failed to fetch nearby healthcare services: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleServicePress = (service: Service) => {
    setSelectedService(service);
    Alert.alert(
      service.name,
      `Address: ${service.address}\nDistance: ${service.distance} km\nRating: ${service.rating || 'N/A'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Book Appointment', onPress: () => bookAppointment(service) },
        { text: 'Get Directions', onPress: () => getDirections(service) }
      ]
    );
  };

  const bookAppointment = async (service: Service) => {
    try {
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + 1); // Tomorrow

      const response = await axios.post(`${API_BASE_URL}/api/services/healthcare/book`, {
        serviceId: service.id,
        serviceName: service.name,
        appointmentDate: appointmentDate.toISOString().split('T')[0],
        appointmentTime: '10:00 AM',
        userPhone: user?.phone,
        userName: user?.name
      });

      Alert.alert('Success', 'Appointment booked successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    }
  };

  const getDirections = (service: Service) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${service.location.lat},${service.location.lng}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Finding nearby healthcare services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.navigate('Welcome', { user })}
        >
          <Text style={styles.backButtonText}>← Back to Welcome</Text>
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Healthcare Services</Text>
        <Text style={styles.headerSubtitle}>Find nearby hospitals, clinics, and pharmacies</Text>
      </View>

      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.activeToggleText]}>List</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleButton, viewMode === 'map' && styles.activeToggle]}
          onPress={() => setViewMode('map')}
        >
          <Text style={[styles.toggleText, viewMode === 'map' && styles.activeToggleText]}>Map</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {viewMode === 'list' ? (
        <ScrollView style={styles.servicesList}>
          {services.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏥</Text>
              <Text style={styles.emptyTitle}>No services found</Text>
              <Text style={styles.emptySubtitle}>Try refreshing or check your location</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={getCurrentLocation}>
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            services.map((service, index) => (
              <TouchableOpacity 
                key={service.id || index}
                style={styles.serviceCard}
                onPress={() => handleServicePress(service)}
              >
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceIcon}>
                    {service.types?.includes('hospital') ? '🏥' : 
                     service.types?.includes('pharmacy') ? '💊' : '🏥'}
                  </Text>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceAddress}>{service.address}</Text>
                  </View>
                </View>
                <View style={styles.serviceDetails}>
                  <Text style={styles.serviceDistance}>{service.distance} km away</Text>
                  {service.rating && (
                    <Text style={styles.serviceRating}>⭐ {service.rating}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : (
        <View style={styles.mapContainer}>
          {location && (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              {/* User's location */}
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                title="Your Location"
                pinColor="blue"
              />
              
              {/* Healthcare services */}
              {services.map((service, index) => (
                <Marker
                  key={service.id || index}
                  coordinate={{
                    latitude: service.location.lat,
                    longitude: service.location.lng,
                  }}
                  title={service.name}
                  description={service.address}
                  pinColor="red"
                  onPress={() => handleServicePress(service)}
                />
              ))}
            </MapView>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  navBar: {
    paddingTop: 40,
    paddingBottom: 10,
    alignItems: 'flex-start',
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeToggle: {
    backgroundColor: '#3498db',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  activeToggleText: {
    color: '#ffffff',
  },
  servicesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  serviceAddress: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDistance: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
  },
  serviceRating: {
    fontSize: 14,
    color: '#f39c12',
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  map: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 16,
  },
}); 