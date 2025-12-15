import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  posts: [],
  currentPost: null,
  loading: false,
  error: null,
};

const postSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setPosts: (state, action) => {
      state.posts = action.payload;
      state.loading = false;
    },
    setPost: (state, action) => {
      const updatedPost = action.payload.post;
      state.posts = state.posts.map((post) =>
        post._id === updatedPost._id ? updatedPost : post
      );
      if (state.currentPost?._id === updatedPost._id) {
        state.currentPost = updatedPost;
      }
    },
    setCurrentPost: (state, action) => {
      state.currentPost = action.payload;
    },
    addPost: (state, action) => {
      state.posts.unshift(action.payload);
    },
    removePost: (state, action) => {
      state.posts = state.posts.filter((post) => post._id !== action.payload);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearPosts: (state) => {
      state.posts = [];
      state.currentPost = null;
    },
  },
});

export const {
  setPosts,
  setPost,
  setCurrentPost,
  addPost,
  removePost,
  setLoading,
  setError,
  clearPosts,
} = postSlice.actions;

export default postSlice.reducer; 