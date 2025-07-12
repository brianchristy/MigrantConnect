import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';

export default function LoginScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${process.env.API_BASE_URL}/api/auth/login`, { phone, password });
      Alert.alert('Success', 'Login successful!');
      if (navigation) navigation.navigate('Welcome', { user: res.data.user });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>MigrantConnect</Text>
            <Text style={styles.subtitle}>Portable Digital Identity</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput 
              value={phone} 
              onChangeText={setPhone} 
              keyboardType="phone-pad" 
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.label}>Password</Text>
            <TextInput 
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry 
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
            />
            
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2c3e50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  linkText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
}); 