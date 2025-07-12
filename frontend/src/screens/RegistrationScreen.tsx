import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { registerUser } from '../services/auth';
import { languageNames, Language } from '../i18n';

export default function RegistrationScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [selectedRole, setSelectedRole] = useState<'migrant' | 'requester'>('migrant');
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    try {
      await registerUser({ name, phone, password, language: selectedLanguage, role: selectedRole });
      Alert.alert('Success', 'Registration successful!');
      if (navigation) navigation.navigate('Login');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Registration failed');
    }
  };

  const handleLanguageSelect = async (language: Language) => {
    setSelectedLanguage(language);
    setShowLanguageSelection(false);
  };

  const handleRoleSelect = (role: 'migrant' | 'requester') => {
    setSelectedRole(role);
    setShowRoleSelection(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>Register</Text>
            <Text style={styles.subtitle}>Join MigrantConnect</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Name</Text>
            <TextInput 
              value={name} 
              onChangeText={setName} 
              style={styles.input}
              placeholder="Enter your name"
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
              placeholder="Enter your password"
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
            
            {/* Language Selection */}
            <Text style={styles.label}>Language Preference</Text>
            <TouchableOpacity 
              style={styles.languageButton} 
              onPress={() => setShowLanguageSelection(true)}
            >
              <Text style={styles.languageButtonText}>
                {languageNames[selectedLanguage]}
              </Text>
              <Text style={styles.languageArrow}>▼</Text>
            </TouchableOpacity>

            {/* Role Selection */}
            <Text style={styles.label}>Role</Text>
            <TouchableOpacity 
              style={styles.roleButton} 
              onPress={() => setShowRoleSelection(true)}
            >
              <Text style={styles.roleButtonText}>
                {selectedRole === 'migrant' ? 'Migrant' : 'Requester'}
              </Text>
              <Text style={styles.roleArrow}>▼</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
              <Text style={styles.registerButtonText}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Login here</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageSelection}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguageSelection(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLanguageSelection(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {Object.entries(languageNames).map(([code, name]) => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.languageOption,
                    selectedLanguage === code && styles.languageOptionSelected
                  ]}
                  onPress={() => handleLanguageSelect(code as Language)}
                >
                  <Text style={[
                    styles.languageOptionText,
                    selectedLanguage === code && styles.languageOptionTextSelected
                  ]}>
                    {name}
                  </Text>
                  {selectedLanguage === code && (
                    <Text style={styles.languageOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
    </View>
      </Modal>

      {/* Role Selection Modal */}
      <Modal
        visible={showRoleSelection}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRoleSelection(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Role</Text>
              <TouchableOpacity onPress={() => setShowRoleSelection(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole === 'migrant' && styles.roleOptionSelected
                ]}
                onPress={() => handleRoleSelect('migrant')}
              >
                <Text style={[
                  styles.roleOptionText,
                  selectedRole === 'migrant' && styles.roleOptionTextSelected
                ]}>
                  Migrant
                </Text>
                {selectedRole === 'migrant' && (
                  <Text style={styles.roleOptionCheck}>✓</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole === 'requester' && styles.roleOptionSelected
                ]}
                onPress={() => handleRoleSelect('requester')}
              >
                <Text style={[
                  styles.roleOptionText,
                  selectedRole === 'requester' && styles.roleOptionTextSelected
                ]}>
                  Requester
                </Text>
                {selectedRole === 'requester' && (
                  <Text style={styles.roleOptionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
    </View>
      </Modal>
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
  languageButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageButtonText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  languageArrow: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  roleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleButtonText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  roleArrow: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalClose: {
    fontSize: 24,
    color: '#7f8c8d',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
  },
  languageOptionSelected: {
    backgroundColor: '#3498db',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  languageOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  languageOptionCheck: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
  },
  roleOptionSelected: {
    backgroundColor: '#3498db',
  },
  roleOptionText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  roleOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  roleOptionCheck: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
}); 