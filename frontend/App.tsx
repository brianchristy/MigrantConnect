import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import RegistrationScreen from './src/screens/RegistrationScreen';
import LoginScreen from './src/screens/LoginScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import QRScreen from './src/screens/QRScreen';
import HealthcareScreen from './src/screens/HealthcareScreen';
import VerificationScreen from './src/screens/VerificationScreen';
import SimpleScannerTest from './src/components/SimpleScannerTest';
import QRCodeTestGenerator from './src/components/QRCodeTestGenerator';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegistrationScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="QR" component={QRScreen} />
        <Stack.Screen name="Healthcare" component={HealthcareScreen} />
        <Stack.Screen name="Verification" component={VerificationScreen} />
        <Stack.Screen name="ScannerTest" component={SimpleScannerTest} />
        <Stack.Screen name="QRGenerator" component={QRCodeTestGenerator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
