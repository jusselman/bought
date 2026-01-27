import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../../redux/slices/authSlice';
import { getAvatarUrl } from '../../utils/imageUtils';
import api from '../../services/api';

const SearchUsersScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followingInProgress, setFollowingInProgress] = useState({});
  
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);

  // Fetch all users on mount
  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      // Fetch all users, maybe want to add pagination later
      const response = await api.get('/users/search/query?query=');
      if (response.data.success) {
        // Filter out current user and sort alphabetically
        const filteredUsers = response.data.users
          .filter(user => user._id !== currentUser._id)
          .sort((a, b) => a.name.localeCompare(b.name));
        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      // If search is cleared, show all users again
      fetchAllUsers();
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/users/search/query?query=${query}`);
      if (response.data.success) {
        // Filter out current user from results
        const filteredUsers = response.data.users
          .filter(user => user._id !== currentUser._id)
          .sort((a, b) => a.name.localeCompare(b.name));
        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetUserId) => {
  if (followingInProgress[targetUserId]) return;

  setFollowingInProgress({ ...followingInProgress, [targetUserId]: true });

  try {
    const response = await api.put(
      `/users/${currentUser._id}/follow/${targetUserId}`
    );

    console.log('👥 Follow response:', response.data);

    if (response.data.success) {
      // Extract just the IDs for Redux to match the User model structure
      const followingIds = response.data.following.map(user => 
        typeof user === 'string' ? user : user._id
      );
      
      dispatch(updateUser({
        following: followingIds
      }));

      // Refresh the user list to show updated follow status
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        fetchAllUsers();
      }
    }
  } catch (error) {
    console.error('Error following user:', error);
    Alert.alert('Error', 'Failed to update follow status');
  } finally {
    setFollowingInProgress({ ...followingInProgress, [targetUserId]: false });
  }
};

  const isFollowing = (userId) => {
  if (!currentUser?.following) return false;
  
  return currentUser.following.some(item => {
    // Handle both cases: array of IDs or array of user objects
    const id = typeof item === 'string' ? item : item._id;
    return id === userId;
  });
};

  const renderUserItem = ({ item }) => {
    const following = isFollowing(item._id);
    const inProgress = followingInProgress[item._id];

    return (
      <TouchableOpacity 
        style={styles.userItem}
        onPress={() => {
          // Navigate to user profile (you can implement this later)
          console.log('Navigate to user:', item._id);
        }}
      >
        <Image
          source={{ uri: getAvatarUrl(item.picturePath) }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userHandle}>@{item.userName}</Text>
          {item.bio && (
            <Text style={styles.userBio} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.followButton,
            following && styles.followingButton
          ]}
          onPress={() => handleFollowToggle(item._id)}
          disabled={inProgress}
        >
          {inProgress ? (
            <ActivityIndicator size="small" color={following ? "#000" : "#FFF"} />
          ) : (
            <Text style={[
              styles.followButtonText,
              following && styles.followingButtonText
            ]}>
              {following ? 'Following' : 'Follow'}
            </Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color="#CCC" />
        <Text style={styles.emptyText}>No users found</Text>
        <Text style={styles.emptySubtext}>
          Try a different search term
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Users</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or username..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            searchUsers(text);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => {
            setSearchQuery('');
            fetchAllUsers(); // Reset to show all users
          }}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={
            users.length === 0 ? styles.emptyList : styles.listContent
          }
        />
      )}
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
    fontSize: 20,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 12,
    margin: 16,
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
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  userHandle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userBio: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  followButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  followButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

export default SearchUsersScreen;