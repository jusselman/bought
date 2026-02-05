import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import api from '../../services/api';

const ReleasesScreen = ({ navigation }) => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await api.get(`/updates/feed?page=${pageNum}&limit=20`);

      if (response.data.success) {
        const newUpdates = response.data.updates;
        
        if (isRefresh || pageNum === 1) {
          setUpdates(newUpdates);
        } else {
          setUpdates(prev => [...prev, ...newUpdates]);
        }

        setHasMore(response.data.pagination.page < response.data.pagination.pages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching updates:', error);
      Alert.alert('Error', 'Failed to load updates');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUpdates(1, true);
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchUpdates(page + 1);
    }
  };

  const handleUpdatePress = async (update) => {
    try {
      // Track view
      await api.post(`/updates/${update._id}/view`);

      // Open source URL
      if (update.sourceUrl) {
        const url = update.sourceUrl.startsWith('http') 
          ? update.sourceUrl 
          : `https://${update.sourceUrl}`;
        
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Cannot open this link');
        }
      }
    } catch (error) {
      console.error('Error opening update:', error);
      Alert.alert('Error', 'Failed to open update');
    }
  };

  const getUpdateTypeIcon = (type) => {
    switch (type) {
      case 'product_launch':
        return 'rocket-outline';
      case 'collection':
        return 'shirt-outline';
      case 'collaboration':
        return 'people-outline';
      case 'event':
        return 'calendar-outline';
      case 'press_release':
        return 'newspaper-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const getUpdateTypeLabel = (type) => {
    switch (type) {
      case 'product_launch':
        return 'NEW LAUNCH';
      case 'collection':
        return 'COLLECTION';
      case 'collaboration':
        return 'COLLAB';
      case 'event':
        return 'EVENT';
      case 'press_release':
        return 'PRESS';
      default:
        return 'UPDATE';
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const published = new Date(date);
    const diff = now - published;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 7) {
      return published.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const renderUpdateItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.updateCard}
      onPress={() => handleUpdatePress(item)}
      activeOpacity={0.9}
    >
      {/* Brand Header */}
      <View style={styles.updateHeader}>
        <View style={styles.brandInfo}>
          {item.brandId?.logoPath && (
            <Image
              source={{ uri: item.brandId.logoPath }}
              style={styles.brandLogo}
            />
          )}
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandName}>{item.brandId?.name}</Text>
            <Text style={styles.timestamp}>{getTimeAgo(item.publishedDate)}</Text>
          </View>
        </View>
        
        {/* Update Type Badge */}
        <View style={styles.typeBadge}>
          <Ionicons 
            name={getUpdateTypeIcon(item.updateType)} 
            size={12} 
            color="#666" 
            style={styles.typeBadgeIcon}
          />
          <Text style={styles.typeBadgeText}>
            {getUpdateTypeLabel(item.updateType)}
          </Text>
        </View>
      </View>

      {/* Update Image */}
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.updateImage}
          resizeMode="cover"
        />
      )}

      {/* Update Content */}
      <View style={styles.updateContent}>
        <Text style={styles.updateTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.updateDescription} numberOfLines={3}>
          {item.description}
        </Text>

        {/* Read More */}
        <View style={styles.readMoreContainer}>
          <Text style={styles.readMoreText}>Read more</Text>
          <Ionicons name="arrow-forward" size={14} color="#007AFF" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-outline" size={64} color="#CCC" />
        <Text style={styles.emptyTitle}>No Updates Yet</Text>
        <Text style={styles.emptyText}>
          Follow some brands to see their latest releases and news
        </Text>
        <TouchableOpacity 
          style={styles.exploreButton}
          onPress={() => navigation.navigate('Discover')}
        >
          <Text style={styles.exploreButtonText}>Explore Brands</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#000" />
        <Text style={styles.footerLoaderText}>Loading more...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading updates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Releases</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Updates Feed */}
      <FlatList
        data={updates}
        renderItem={renderUpdateItem}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={
          updates.length === 0 ? styles.emptyList : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#000"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />
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
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 100,
  },
  updateCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#F5F5F5',
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
  },
  brandTextContainer: {
    flex: 1,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeIcon: {
    marginRight: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.5,
  },
  updateImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F0F0F0',
    marginTop: 8,
  },
  updateContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  updateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    lineHeight: 24,
    marginBottom: 8,
  },
  updateDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 4,
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
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    // paddingTop: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerLoaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default ReleasesScreen;