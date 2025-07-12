import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Location from 'expo-location';
import { VerifiableCredential } from '../services/credentialStorage';
import verificationService, { QRPayload } from '../services/verificationService';

interface QRCodeGeneratorProps {
  credential: VerifiableCredential;
  service: string;
  onClose: () => void;
  onConsentRequired: (consentData: any) => void;
}

const { width } = Dimensions.get('window');

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  credential,
  service,
  onClose,
  onConsentRequired
}) => {
  const [qrData, setQrData] = useState<QRPayload | null>(null);
  const [qrHash, setQrHash] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expiryTime, setExpiryTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    generateQR();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (expiryTime) {
      const timer = setInterval(updateTimeRemaining, 1000);
      return () => clearInterval(timer);
    }
  }, [expiryTime]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    } catch (error) {
      console.log('Location permission denied or error:', error);
    }
  };

  const generateQR = async () => {
    try {
      setLoading(true);
      
      const result = await verificationService.generateQR(credential, 15); // 15 minutes expiry
      
      setQrData(result.qrPayload);
      setQrHash(result.qrHash);
      setExpiryTime(new Date(result.validUntil));
      
    } catch (error) {
      console.error('Error generating QR:', error);
      Alert.alert('Error', 'Failed to generate QR code');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const updateTimeRemaining = () => {
    if (!expiryTime) return;

    const now = new Date();
    const diff = expiryTime.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining('Expired');
      Alert.alert('QR Expired', 'The QR code has expired. Please generate a new one.');
      onClose();
      return;
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  };

  const handleShare = () => {
    if (!qrData) return;

    // Prepare consent data
    const consentData = {
      credential,
      service,
      qrHash,
      location: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      } : undefined,
      timestamp: new Date().toISOString()
    };

    onConsentRequired(consentData);
  };

  const getServiceDisplayName = (serviceId: string) => {
    switch (serviceId) {
      case 'ration_portability':
        return 'Ration Portability';
      case 'health_emergency':
        return 'Health Emergency';
      case 'education_scholarship':
        return 'Education Scholarship';
      case 'skill_training':
        return 'Skill Training';
      default:
        return serviceId;
    }
  };

  const getCredentialDisplayName = (type: string) => {
    switch (type) {
      case 'RationCardVC':
        return 'Ration Card';
      case 'HealthCardVC':
        return 'Health Card';
      case 'EducationCardVC':
        return 'Education Card';
      case 'SkillCertVC':
        return 'Skill Certificate';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Generating QR Code...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.title}>Share Credential</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Service and Credential Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.infoText}>
              Service: {getServiceDisplayName(service)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="card" size={20} color="#2196F3" />
            <Text style={styles.infoText}>
              Credential: {getCredentialDisplayName(credential.type)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color="#FF9800" />
            <Text style={styles.infoText}>
              Expires in: {timeRemaining}
            </Text>
          </View>
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          {qrData && (
            <QRCode
              value={JSON.stringify(qrData)}
              size={width * 0.7}
              color="black"
              backgroundColor="white"
              logoSize={60}
              logoBackgroundColor="white"
              logoBorderRadius={30}
              logoMargin={10}
            />
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Instructions:</Text>
          <Text style={styles.instructionsText}>
            1. Show this QR code to the service provider
          </Text>
          <Text style={styles.instructionsText}>
            2. The QR code will expire in {timeRemaining}
          </Text>
          <Text style={styles.instructionsText}>
            3. Only share when you're ready to verify
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share" size={20} color="white" />
            <Text style={styles.shareButtonText}>Share Credential</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.refreshButton} onPress={generateQR}>
            <Ionicons name="refresh" size={20} color="#007AFF" />
            <Text style={styles.refreshButtonText}>Refresh QR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#2C3E50',
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  instructionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    gap: 12,
  },
  shareButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  refreshButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  refreshButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default QRCodeGenerator; 