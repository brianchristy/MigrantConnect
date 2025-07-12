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
import { useLanguage } from '../i18n/LanguageContext';

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
  const { translations: t } = useLanguage();
  const user = route?.params?.user;
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  // Filter states
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['hospital', 'clinic', 'pharmacy']);
  const [maxDistance, setMaxDistance] = useState(10); // km
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t.common.permissionDenied, t.healthcare.locationPermissionRequired);
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      // Fetch nearby healthcare services
      await fetchNearbyServices(currentLocation.coords.latitude, currentLocation.coords.longitude);
    } catch (error) {
      Alert.alert(t.common.error, t.healthcare.locationError);
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyServices = async (latitude: number, longitude: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/services/healthcare/nearby`, {
        params: { latitude, longitude, radius: 10000 } // Increased radius for better filtering
      });
      
      setServices(response.data.services);
      setFilteredServices(response.data.services); // Initially show all services
    } catch (error: any) {
      console.error('Error fetching services:', error);
      Alert.alert(t.common.error, `${t.healthcare.fetchError}: ${error.response?.data?.error || error.message}`);
    }
  };

  // Apply filters to services and remove duplicates
  const applyFilters = () => {
    // Remove duplicates based on name and distance (same facility at same distance)
    const uniqueServices = services.filter((service, index, self) => {
      const firstIndex = self.findIndex(s => 
        s.name === service.name && 
        Math.abs(s.distance - service.distance) < 0.4 // Same facility within 0.1km
      );
      return firstIndex === index;
    });

    // Sort by distance first
    const sortedServices = uniqueServices.sort((a, b) => a.distance - b.distance);

    // Apply filters
    const filtered = sortedServices.filter(service => {
      // Filter by type - check if service type matches any selected type
      const serviceType = service.types?.[0] || 'healthcare';
      const typeMatch = selectedTypes.includes(serviceType) || 
                       (serviceType === 'healthcare' && selectedTypes.length > 0);
      
      // Filter by distance
      const distanceMatch = service.distance <= maxDistance;
      
      return typeMatch && distanceMatch;
    });
    
    // Limit to top 50 results by distance
    const topResults = filtered.slice(0, 50);
    
    setFilteredServices(topResults);
  };

  // Update filters when selectedTypes or maxDistance changes
  useEffect(() => {
    if (services.length > 0) {
      applyFilters();
    }
  }, [selectedTypes, maxDistance, services]);

  const handleServicePress = (service: Service) => {
    setSelectedService(service);
    Alert.alert(
      service.name,
      `${t.healthcare.address}: ${service.address}\n${t.healthcare.distance}: ${service.distance} km\n${t.healthcare.type}: ${service.types?.[0] || t.healthcare.healthcare}`,
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.healthcare.bookAppointment, onPress: () => bookAppointment(service) },
        { text: t.healthcare.getDirections, onPress: () => getDirections(service) }
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

      Alert.alert(t.common.success, t.healthcare.appointmentBooked);
    } catch (error) {
      Alert.alert(t.common.error, t.healthcare.appointmentError);
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
          <Text style={styles.loadingText}>{t.healthcare.findingServices}</Text>
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
          <Text style={styles.backButtonText}>← {t.common.backToWelcome}</Text>
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.healthcare.title}</Text>
        <Text style={styles.headerSubtitle}>{t.healthcare.subtitle}</Text>
      </View>

      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.activeToggleText]}>
            {t.healthcare.list}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleButton, viewMode === 'map' && styles.activeToggle]}
          onPress={() => setViewMode('map')}
        >
          <Text style={[styles.toggleText, viewMode === 'map' && styles.activeToggleText]}>
            {t.healthcare.map}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Button */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>🔍 {t.healthcare.filters}</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {/* Service Type Filters */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>{t.healthcare.serviceTypes}</Text>
            <View style={styles.typeButtons}>
              {[
                { key: 'hospital', label: t.healthcare.hospitals },
                { key: 'clinic', label: t.healthcare.clinics },
                { key: 'pharmacy', label: t.healthcare.pharmacies }
              ].map(type => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeButton,
                    selectedTypes.includes(type.key) && styles.selectedTypeButton
                  ]}
                  onPress={() => {
                    if (selectedTypes.includes(type.key)) {
                      setSelectedTypes(selectedTypes.filter(t => t !== type.key));
                    } else {
                      setSelectedTypes([...selectedTypes, type.key]);
                    }
                  }}
                >
                  <Text style={[
                    styles.typeButtonText,
                    selectedTypes.includes(type.key) && styles.selectedTypeButtonText
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Distance Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>{t.healthcare.maxDistance} ({maxDistance} km)</Text>
            <View style={styles.distanceButtons}>
              {[1, 3, 5, 10, 20].map(distance => (
                <TouchableOpacity
                  key={distance}
                  style={[
                    styles.distanceButton,
                    maxDistance === distance && styles.selectedDistanceButton
                  ]}
                  onPress={() => setMaxDistance(distance)}
                >
                  <Text style={[
                    styles.distanceButtonText,
                    maxDistance === distance && styles.selectedDistanceButtonText
                  ]}>
                    {distance} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {t.healthcare.foundServices}: {filteredServices.length}
        </Text>
      </View>

      {/* Content */}
      {viewMode === 'list' ? (
        <ScrollView style={styles.listContainer}>
          {filteredServices.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏥</Text>
              <Text style={styles.emptyTitle}>{t.healthcare.noServicesFound}</Text>
              <Text style={styles.emptySubtitle}>{t.healthcare.tryAdjustingFilters}</Text>
            </View>
          ) : (
            filteredServices.map((service, index) => (
              <TouchableOpacity
                key={service.id || index}
                style={styles.serviceCard}
                onPress={() => handleServicePress(service)}
              >
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDistance}>{service.distance.toFixed(1)} km</Text>
                </View>
                <Text style={styles.serviceAddress}>{service.address}</Text>
                <View style={styles.serviceFooter}>
                  <Text style={styles.serviceType}>
                    {service.types?.[0]?.charAt(0).toUpperCase() + service.types?.[0]?.slice(1) || t.healthcare.healthcare}
                  </Text>
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
              {/* Current location marker */}
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                title={t.healthcare.yourLocation}
                description={t.healthcare.currentLocation}
                pinColor="#3498db"
              />
              
              {/* Service markers */}
              {filteredServices.map((service, index) => (
                <Marker
                  key={service.id || index}
                  coordinate={{
                    latitude: service.location.lat,
                    longitude: service.location.lng,
                  }}
                  title={service.name}
                  description={`${service.distance.toFixed(1)} km away`}
                  pinColor="#e74c3c"
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
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonActive: {
    backgroundColor: '#2ecc71',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterPanel: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  filterSectionSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e1e8ed',
    marginBottom: 8,
    marginRight: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterChipText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  filterChipDescription: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
  },
  filterChipDescriptionActive: {
    color: '#ecf0f1',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    width: 40,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#e1e8ed',
    borderRadius: 2,
    marginHorizontal: 8,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: '#3498db',
    borderRadius: 10,
    top: -8,
    marginLeft: -10,
  },
  distanceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  distanceButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e1e8ed',
    minWidth: 60,
    alignItems: 'center',
  },
  distanceButtonActive: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  distanceButtonText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '600',
  },
  distanceButtonTextActive: {
    color: '#ffffff',
  },
  resultsCount: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  resultsCountText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
  },
  resultsCountSubtitle: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
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
  serviceType: {
    fontSize: 14,
    color: '#3498db',
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
  filterButtonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  filterContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e1e8ed',
    minWidth: 100,
    alignItems: 'center',
  },
  selectedTypeButton: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  selectedTypeButtonText: {
    color: '#ffffff',
  },
  distanceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  distanceButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e1e8ed',
    minWidth: 60,
    alignItems: 'center',
  },
  selectedDistanceButton: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  distanceButtonText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '600',
  },
  selectedDistanceButtonText: {
    color: '#ffffff',
  },
  resultsContainer: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  resultsText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
  },
  listContainer: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  serviceDistance: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
  },
  serviceAddress: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  serviceType: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
  },
  serviceRating: {
    fontSize: 14,
    color: '#f39c12',
    fontWeight: '600',
  },
}); 