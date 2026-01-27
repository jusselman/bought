import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Same logic as api.js to get the base URL
const getApiUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'ios') {
      const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();
      if (debuggerHost) {
        return `http://${debuggerHost}:6001`;
      }
      return 'http://localhost:6001';
    } else if (Platform.OS === 'android') {
      return 'http://10.0.2.2:6001';
    }
  }
  return 'https://your-production-api.com';
};

const API_URL = getApiUrl();

export const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://via.placeholder.com/150';
  return `${API_URL}/assets/${imagePath}`;
};

export const getAvatarUrl = (picturePath) => {
  if (!picturePath) return 'https://via.placeholder.com/40';
  return `${API_URL}/assets/${picturePath}`;
};