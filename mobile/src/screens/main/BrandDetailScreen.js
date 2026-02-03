import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../redux/slices/authSlice';
import api from '../../services/api';

const BrandDetailScreen = ({ route, navigation }) => {
  const { brandId } = route.params;
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const followedBrandIds = user?.followedBrands || [];

  useEffect(() => {
    fetchBrandDetails();
  }, [brandId]);

  const fetchBrandDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/brands/${brandId}`);
      
      if (response.data.success) {
        setBrand(response.data.brand);
      }
    } catch (error) {
      console.error('Error fetching brand details:', error);
      Alert.alert('Error', 'Failed to load brand details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    setFollowLoading(true);

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
      setFollowLoading(false);
    }
  };

  const handleWebsitePress = () => {
    if (brand?.websiteUrl) {
      let url = brand.websiteUrl;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open website');
      });
    }
  };

  const isFollowing = followedBrandIds.some(id => id.toString() === brandId);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading brand...</Text>
      </View>
    );
  }

  if (!brand) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Brand Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Brand Name */}
        <Text style={styles.brandName}>{brand.name}</Text>

        {/* Website Link - only render if websiteUrl exists */}
        {brand.websiteUrl && (
          <TouchableOpacity onPress={handleWebsitePress} style={styles.websiteContainer}>
            <Ionicons name="globe-outline" size={20} color="#007AFF" style={styles.websiteIcon} />
            <Text style={styles.websiteText}>{brand.websiteUrl}</Text>
            <Ionicons name="open-outline" size={16} color="#007AFF" />
          </TouchableOpacity>
        )}

        {/* Brand Image with loading placeholder */}
        {brand.logoPath && (
          <View style={styles.imageContainer}>
            {!imageLoaded && (
              <ActivityIndicator style={styles.imagePlaceholder} size="large" color="#999" />
            )}
            <Image
              source={{ uri: brand.logoPath }}
              style={[styles.brandImage, !imageLoaded && styles.imageHidden]}
              resizeMode="cover"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
          </View>
        )}

        {/* About Section - uses description from MongoDB */}
        <Text style={styles.aboutTitle}>ABOUT</Text>
        <Text style={styles.aboutText}>
          {brand.description || 'No description available.'}
        </Text>

        {/* Follow Button */}
        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={handleFollowToggle}
          disabled={followLoading}
        >
          {followLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.followButtonText}>
              {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 32,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  brandName: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  websiteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  websiteIcon: {
    marginRight: 8,
  },
  websiteText: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 4,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    marginBottom: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandImage: {
    position: 'absolute',
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  imageHidden: {
    opacity: 0,
  },
  imagePlaceholder: {
    position: 'absolute',
    zIndex: 0,
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlign: 'center',
    marginBottom: 32,
  },
  followButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  followingButton: {
    backgroundColor: '#4CAF50',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
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
});

export default BrandDetailScreen;