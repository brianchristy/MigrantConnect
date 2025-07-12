import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { registerUser } from '../services/auth';

export default function RegistrationScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    try {
      await registerUser({ name, phone, password });
      Alert.alert('Success', 'User registered!');
      if (navigation) navigation.navigate('Login');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>Create Account</Text>
            <Text style={styles.subtitle}>Join MigrantConnect</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              value={name} 
              onChangeText={setName} 
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
            />
            
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
              placeholder="Create a password"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput 
              value={confirmPassword} 
              onChangeText={setConfirmPassword} 
              secureTextEntry 
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor="#999"
            />
            
            <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
              <Text style={styles.registerButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logo: {
    fontSize: 28,
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
  registerButton: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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