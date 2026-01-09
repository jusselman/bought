import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Function to get the correct API URL based on environment
const getApiUrl = () => {
  // Check if we're in development mode
  if (__DEV__) {
    // For iOS Simulator, try localhost first
    if (Platform.OS === 'ios') {
      // Use the debugger host to automatically detect your machine
      const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();
      
      if (debuggerHost) {
        // Use the IP that Expo is already using
        return `http://${debuggerHost}:6001`;
      }
      // Fallback to localhost for simulator
      return 'http://localhost:6001';
    } 
    // Android emulator
    else if (Platform.OS === 'android') {
      return 'http://10.0.2.2:6001';
    }
  }
  
  // Production - you'll set this when you deploy
  return 'https://your-production-api.com';
};

const API_URL = getApiUrl();

console.log('🌐 API connecting to:', API_URL);
console.log('📱 Platform:', Platform.OS);
console.log('🔧 Development mode:', __DEV__);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  async (config) => {
    console.log('📤 API Request:', config.method.toUpperCase(), config.url);
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    if (error.response?.status === 401) {
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;