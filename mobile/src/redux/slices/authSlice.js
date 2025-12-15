import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLogin: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      
      // Save to AsyncStorage
      AsyncStorage.setItem('token', action.payload.token);
      AsyncStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    setLogout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      
      // Clear AsyncStorage
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('user');
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      AsyncStorage.setItem('user', JSON.stringify(state.user));
    },
    addBrand: (state, action) => {
      if (state.user) {
        state.user.followedBrands.push(action.payload);
        AsyncStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    removeBrand: (state, action) => {
      if (state.user) {
        state.user.followedBrands = state.user.followedBrands.filter(
          (brand) => brand._id !== action.payload
        );
        AsyncStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
});

export const {
  setLogin,
  setLogout,
  setLoading,
  setError,
  updateUser,
  addBrand,
  removeBrand,
} = authSlice.actions;

export default authSlice.reducer;