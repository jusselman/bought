import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../redux/slices/authSlice';
import api from '../../services/api';

const DiscoverScreen = ({ navigation }) => {
  const [brands, setBrands] = useState([]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [followingInProgress, setFollowingInProgress] = useState({});
  
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const followedBrandIds = user?.followedBrands || [];

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    filterBrands();
  }, [searchQuery, brands]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await api.get('/brands');
      
      if (response.data.success) {
        const sortedBrands = response.data.brands.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setBrands(sortedBrands);
        setFilteredBrands(sortedBrands);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      Alert.alert('Error', 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const filterBrands = () => {
    if (!searchQuery.trim()) {
      setFilteredBrands(brands);
      return;
    }

    const filtered = brands.filter(brand =>
      brand.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredBrands(filtered);
  };

  const handleFollowToggle = async (brandId) => {
  if (followingInProgress[brandId]) return;

  setFollowingInProgress({ ...followingInProgress, [brandId]: true });

  try {
    const response = await api.post(`/users/${user._id}/brands/follow`, {
      brandId,
    });

    if (response.data.success) {
      dispatch(updateUser({
        followedBrands: response.data.followedBrands,
      }));
    }
  } catch (error) {
    console.error('Error following brand:', error);
    Alert.alert('Error', 'Failed to update brand follow status');
  } finally {
    setFollowingInProgress({ ...followingInProgress, [brandId]: false });
  }
};

  const handleBrandPress = (brandId) => {
    navigation.navigate('BrandDetail', { brandId });
  };

  const isFollowing = (brandId) => {
    return followedBrandIds.some(id => id.toString() === brandId);
  };

  const renderBrandItem = ({ item }) => {
    const following = isFollowing(item._id);
    const inProgress = followingInProgress[item._id];

    return (
      <View style={styles.brandItem}>
        {/* Tappable area for brand name - navigates to detail */}
        <TouchableOpacity
          style={styles.brandNameContainer}
          onPress={() => handleBrandPress(item._id)}
        >
          <Text style={styles.brandName}>{item.name}</Text>
        </TouchableOpacity>
        
        {/* Tappable area for follow icon - toggles follow */}
        <TouchableOpacity
          onPress={() => handleFollowToggle(item._id)}
          disabled={inProgress}
          style={styles.followIconContainer}
        >
          {inProgress ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Ionicons
              name={following ? 'checkmark-circle' : 'add-circle-outline'}
              size={28}
              color={following ? '#4CAF50' : '#000'}
            />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Discover Brands</Text>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search brands..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color="#CCC" />
      <Text style={styles.emptyText}>No brands found</Text>
      <Text style={styles.emptySubtext}>
        Try a different search term
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading brands...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={filteredBrands}
        renderItem={renderBrandItem}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          filteredBrands.length === 0 ? styles.emptyList : styles.listContent
        }
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  listContent: {
    paddingBottom: 100,
  },
  brandItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  brandNameContainer: {
    flex: 1,
    paddingRight: 16,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
  },
  followIconContainer: {
    padding: 8,
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
    paddingTop: 60,
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
});

export default DiscoverScreen;