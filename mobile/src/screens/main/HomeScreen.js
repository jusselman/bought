import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { setPosts, setLoading } from '../../redux/slices/postSlice';
import api from '../../services/api';
import PostCard from '../../components/posts/PostCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 97; 
const TAB_BAR_HEIGHT = 85; 

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const posts = useSelector((state) => state.posts.posts);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoadingState] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async (pageNum = 1) => {
  try {
    dispatch(setLoading(true));

    const response = await api.get(`/posts?page=${pageNum}&limit=20&userId=${user._id}`);
    
    if (response.data.success) {
      console.log('Posts received:', response.data.posts.length);
      console.log('First post:', response.data.posts[0]); 
      console.log('First post brandId:', response.data.posts[0]?.brandId);

      if (pageNum === 1) {
        dispatch(setPosts(response.data.posts));
      } else {
        dispatch(setPosts([...posts, ...response.data.posts]));
      }
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    Alert.alert('Error', 'Failed to load posts');
  } finally {
    setLoadingState(false);
    dispatch(setLoading(false));
  }
};

useFocusEffect(
    useCallback(() => {
      // Refetch posts to include newly followed users
      fetchPosts(1);
    }, [user._id])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await fetchPosts(1);
    setRefreshing(false);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  };

  const handlePostPress = (postId) => {
    console.log('Post pressed:', postId);
  };

  const handleUserPress = (userId) => {
    console.log('User pressed:', userId);
  };

  // Handle create post navigation
  const handleCreatePost = () => {
    navigation.navigate('CreatePost');
  };

  const renderPost = ({ item }) => (
    <PostCard
      post={item}
      onPress={handlePostPress}
      onUserPress={handleUserPress}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.logo}>BOUGHT</Text>
      <TouchableOpacity onPress={() => navigation.navigate('SearchUsers')}>
        <Ionicons name="search" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => {
    const availableHeight = SCREEN_HEIGHT - HEADER_HEIGHT - TAB_BAR_HEIGHT;
    
    return (
      <View style={[styles.emptyContainer, { height: availableHeight }]}>
        <Ionicons name="newspaper-outline" size={64} color="#CCC" />
        <Text style={styles.emptyText}>No posts yet</Text>
        <Text style={styles.emptySubtext}>
          Follow brands and users to see their posts here
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={
          posts.length === 0 ? styles.emptyListContent : styles.listContent
        }
      />

      {/* Floating Action Button for Create Post */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreatePost}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    paddingBottom: 100, 
  },
  emptyListContent: {
    flexGrow: 0, 
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100, 
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default HomeScreen;



