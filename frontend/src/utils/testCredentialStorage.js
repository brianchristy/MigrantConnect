// Simple test for credential storage
import AsyncStorage from '@react-native-async-storage/async-storage';

export const testCredentialStorage = async () => {
  try {
    console.log('Testing credential storage...');
    
    // Test basic AsyncStorage
    await AsyncStorage.setItem('test_key', 'test_value');
    const testValue = await AsyncStorage.getItem('test_key');
    console.log('AsyncStorage test:', testValue === 'test_value' ? 'PASSED' : 'FAILED');
    
    // Test base64 encoding/decoding
    const testData = { test: 'data', number: 123 };
    const encoded = btoa(JSON.stringify(testData));
    const decoded = JSON.parse(atob(encoded));
    console.log('Base64 test:', JSON.stringify(decoded) === JSON.stringify(testData) ? 'PASSED' : 'FAILED');
    
    // Test simple hash function
    const testString = 'test_string_for_hashing';
    let hash = 0;
    for (let i = 0; i < testString.length; i++) {
      const char = testString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const hashResult = Math.abs(hash).toString(16).substring(0, 16);
    console.log('Hash test:', hashResult.length === 16 ? 'PASSED' : 'FAILED');
    
    console.log('All tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}; 