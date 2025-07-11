import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, TouchableOpacity, Linking } from 'react-native';
import QRCode from '../components/QRCode';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import axios from 'axios';

export default function QRScreen({ route }: any) {
  const user = route?.params?.user;
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

  useEffect(() => {
    if (user?.phone) {
      fetchDocuments(user.phone);
    }
  }, [user]);

  const fetchDocuments = async (phone: string) => {
    try {
      const res = await axios.get(`${process.env.API_BASE_URL}/api/documents/${phone}`);
      setUploadedDocs(res.data);
    } catch (err) {
      setUploadedDocs([]);
    }
  };

  const handleRequestPermission = async () => {
    const { status } = await requestPermission();
    setShowScanner(status === 'granted');
  };

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    setShowScanner(false);
    setScannedData(result.data);

    let parsed = null;
    try {
      parsed = JSON.parse(result.data);
    } catch (e) {}

    // If the QR contains a download link, open it directly
    if (parsed && parsed.download) {
      Linking.openURL(parsed.download);
    } else if (typeof result.data === 'string' && result.data.startsWith('http')) {
      Linking.openURL(result.data);
    } else {
      Alert.alert('QR Code Scanned', result.data);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Available Documents</Text>
      {/* List of available documents */}
      {uploadedDocs.length === 0 && <Text>No documents uploaded yet.</Text>}
      {uploadedDocs.map((doc, idx) => (
        <TouchableOpacity
          key={doc._id || idx}
          style={{ backgroundColor: '#eee', padding: 16, borderRadius: 8, marginBottom: 16, width: 200, alignItems: 'center' }}
          onPress={() => setSelectedDoc(doc)}
        >
          <Text style={{ fontSize: 16 }}>{doc.type.charAt(0).toUpperCase() + doc.type.slice(1)} ({doc.fileName})</Text>
        </TouchableOpacity>
      ))}
      {/* Show QR code only when a document is selected */}
      {selectedDoc && (
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 16, marginBottom: 10 }}>{selectedDoc.type.charAt(0).toUpperCase() + selectedDoc.type.slice(1)} QR Code</Text>
          <QRCode value={JSON.stringify({ download: `${process.env.API_BASE_URL}/api/documents/${selectedDoc._id}/download` })} />
          <Button title="Hide QR Code" onPress={() => setSelectedDoc(null)} />
        </View>
      )}
      <Button title="Scan QR Code" onPress={handleRequestPermission} />
      {showScanner && permission?.granted && (
        <CameraView
          style={{ width: 300, height: 300, marginTop: 20 }}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarCodeScanned}
        />
      )}
      {scannedData && (() => {
        let parsed = null;
        try {
          parsed = JSON.parse(scannedData);
        } catch (e) {}
        return parsed ? (
          <View style={{ marginTop: 20 }}>
            {parsed.download && (
              <Text selectable style={{ color: 'blue' }} onPress={() => Linking.openURL(parsed.download)}>
                Download Document
              </Text>
            )}
            {parsed.phone && <Text>Scanned Phone: {parsed.phone}</Text>}
            {parsed.aadhaar && <Text>Scanned Aadhaar: {parsed.aadhaar}</Text>}
            {parsed.name && <Text>Scanned Name: {parsed.name}</Text>}
          </View>
        ) : (
          <Text style={{ marginTop: 20 }}>Scanned Data: {scannedData}</Text>
        );
      })()}
    </View>
  );
} 