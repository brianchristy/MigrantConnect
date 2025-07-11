import React from 'react';
import { View, Text, Button } from 'react-native';

export default function WelcomeScreen({ route, navigation }: any) {
  const user = route?.params?.user;
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Welcome{user && user.name ? `, ${user.name}` : ''}!
      </Text>
      <Button title="Logout" onPress={() => navigation.navigate('Login')} />
    </View>
  );
} 