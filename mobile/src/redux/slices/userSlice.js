import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  users: [],
  currentProfile: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUsers: (state, action) => {
      state.users = action.payload;
      state.loading = false;
    },
    setCurrentProfile: (state, action) => {
      state.currentProfile = action.payload;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearUsers: (state) => {
      state.users = [];
      state.currentProfile = null;
    },
  },
});

export const {
  setUsers,
  setCurrentProfile,
  setLoading,
  setError,
  clearUsers,
} = userSlice.actions;

export default userSlice.reducer;