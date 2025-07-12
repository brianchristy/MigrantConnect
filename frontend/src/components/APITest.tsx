import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';
import { debugAPICall } from '../utils/debugAPI';

const APITest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testAPIConnection = async () => {
    setLoading(true);
    addResult('Testing API connection...');
    
    try {
      console.log('Testing API connection to:', API_BASE_URL);
      addResult(`Connecting to: ${API_BASE_URL}`);
      
      const response = await fetch(`${API_BASE_URL}/available-services`);
      const data = await response.json();
      
      if (response.ok) {
        addResult(`✅ API connected successfully! Found ${data.services?.length || 0} services`);
        console.log('API test successful:', data);
      } else {
        addResult(`❌ API returned error: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      const errorMsg = `❌ API connection failed: ${error.message}`;
      addResult(errorMsg);
      console.error('API test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const testQRGeneration = async () => {
    setLoading(true);
    addResult('Testing QR generation...');
    
    try {
      const testCredential = {
        type: 'RationCardVC',
        issuedBy: 'TestDept',
        issuedAt: '2024-01-01T00:00:00Z',
        expiresAt: '2025-12-31T23:59:59Z',
        credentialSubject: {
          userId: 'test123',
          entitlement: '5kg/month',
          ONORC_enabled: true
        },
        status: 'active'
      };

      const response = await fetch(`${API_BASE_URL}/api/generate-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: testCredential,
          expiryMinutes: 15
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        addResult('✅ QR generation successful!');
        console.log('QR generation test successful:', data);
      } else {
        addResult(`❌ QR generation failed: ${response.status} ${data.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      const errorMsg = `❌ QR generation failed: ${error.message}`;
      addResult(errorMsg);
      console.error('QR generation test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runDebugTest = async () => {
    setLoading(true);
    addResult('Running debug test...');
    
    try {
      await debugAPICall();
      addResult('✅ Debug test completed - check console for details');
    } catch (error: any) {
      addResult(`❌ Debug test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.testButton, loading && styles.disabledButton]} 
          onPress={testAPIConnection}
          disabled={loading}
        >
          <Ionicons name="wifi" size={20} color="white" />
          <Text style={styles.buttonText}>Test API Connection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.testButton, loading && styles.disabledButton]} 
          onPress={testQRGeneration}
          disabled={loading}
        >
          <Ionicons name="qr-code" size={20} color="white" />
          <Text style={styles.buttonText}>Test QR Generation</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.testButton, loading && styles.disabledButton]} 
          onPress={runDebugTest}
          disabled={loading}
        >
          <Ionicons name="bug" size={20} color="white" />
          <Text style={styles.buttonText}>Run Debug Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
          <Ionicons name="trash" size={20} color="#FF6B6B" />
          <Text style={styles.clearButtonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>No tests run yet. Tap a test button above.</Text>
        ) : (
          testResults.map((result, index) => (
            <Text key={index} style={styles.resultText}>
              {result}
            </Text>
          ))
        )}
      </ScrollView>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Troubleshooting:</Text>
        <Text style={styles.infoText}>• Make sure backend is running on port 5000</Text>
        <Text style={styles.infoText}>• Check if localhost is accessible from your device</Text>
        <Text style={styles.infoText}>• Try using your computer's IP address instead of localhost</Text>
        <Text style={styles.infoText}>• Check console logs for detailed error messages</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  clearButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  noResults: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  resultText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 18,
  },
});

export default APITest; 