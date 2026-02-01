import { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAvatarUrl } from '../../utils/imageUtils';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { updateUser, setLogout } from '../../redux/slices/authSlice';
import api from '../../services/api';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    userName: user?.userName || '',
    bio: user?.bio || '',
    city: user?.city || '',
    website: user?.website || '',
    instagram: user?.socialMedia?.instagram || '',
    tiktok: user?.socialMedia?.tiktok || '',
    facebook: user?.socialMedia?.facebook || '',
    twitter: user?.socialMedia?.twitter || '',
  });

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        try {
          const response = await api.get(`/users/${user._id}`);
          if (response.data.success) {
            dispatch(updateUser(response.data.user));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };
      
      fetchUserData();
    }, [user._id])
  );

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0]);
    }
  };

  const handleSave = async () => {
  setLoading(true);

  try {
    let response;
    
    if (profileImage) {
      const formDataObj = new FormData();
      
      formDataObj.append('name', formData.name);
      formDataObj.append('userName', formData.userName);
      formDataObj.append('bio', formData.bio);
      formDataObj.append('city', formData.city);
      formDataObj.append('website', formData.website);
      
      formDataObj.append('socialMedia', JSON.stringify({
        instagram: formData.instagram,
        tiktok: formData.tiktok,
        facebook: formData.facebook,
        twitter: formData.twitter,
      }));

      const uriParts = profileImage.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formDataObj.append('picture', {
        uri: profileImage.uri,
        name: `profile_${user._id}.${fileType}`,
        type: `image/${fileType}`,
      });
      response = await api.patch(`/users/${user._id}`, formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      response = await api.patch(`/users/${user._id}`, {
        name: formData.name,
        userName: formData.userName,
        bio: formData.bio,
        city: formData.city,
        website: formData.website,
        socialMedia: {
          instagram: formData.instagram,
          tiktok: formData.tiktok,
          facebook: formData.facebook,
          twitter: formData.twitter,
        },
      });
    }

    if (response.data && response.data.user) {
      dispatch(updateUser(response.data.user));
      setIsEditing(false);
      setProfileImage(null);
      Alert.alert('Success', 'Profile updated successfully');
    } else {
      console.log('⚠️ UNEXPECTED RESPONSE STRUCTURE:', response.data);
      Alert.alert('Warning', 'Update may have succeeded but response was unexpected');
    }
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
  } finally {
    setLoading(false);
  }
};

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      userName: user?.userName || '',
      bio: user?.bio || '',
      city: user?.city || '',
      website: user?.website || '',
      instagram: user?.socialMedia?.instagram || '',
      tiktok: user?.socialMedia?.tiktok || '',
      facebook: user?.socialMedia?.facebook || '',
      twitter: user?.socialMedia?.twitter || '',
    });
    setProfileImage(null);
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => dispatch(setLogout())
        },
      ]
    );
  };

  const renderViewMode = () => (
    <>
      <View style={styles.imageContainer}>
       <Image
          source={{ uri: getAvatarUrl(user?.picturePath) }}
          style={styles.profileImage}
        />
      </View>

      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.userName}>@{user?.userName}</Text>

      <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{user?.followerCount || 0}</Text>
        <Text style={styles.statLabel}>Followers</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{user?.followingCount || 0}</Text>
        <Text style={styles.statLabel}>Following</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {user?.followedBrands?.length || 0}
        </Text>
        <Text style={styles.statLabel}>Brands</Text>
      </View>
    </View>

      {user?.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bioText}>{user.bio}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        
        {user?.city && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.detailText}>{user.city}</Text>
          </View>
        )}
        
        {user?.website && (
          <View style={styles.detailRow}>
            <Ionicons name="globe-outline" size={20} color="#666" />
            <Text style={styles.detailText}>{user.website}</Text>
          </View>
        )}
      </View>

      {(user?.socialMedia?.instagram || user?.socialMedia?.tiktok || 
        user?.socialMedia?.facebook || user?.socialMedia?.twitter) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media</Text>
          
          {user?.socialMedia?.instagram && (
            <View style={styles.detailRow}>
              <Ionicons name="logo-instagram" size={20} color="#666" />
              <Text style={styles.detailText}>@{user.socialMedia.instagram}</Text>
            </View>
          )}
          
          {user?.socialMedia?.tiktok && (
            <View style={styles.detailRow}>
              <Ionicons name="musical-notes-outline" size={20} color="#666" />
              <Text style={styles.detailText}>@{user.socialMedia.tiktok}</Text>
            </View>
          )}
          
          {user?.socialMedia?.twitter && (
            <View style={styles.detailRow}>
              <Ionicons name="logo-twitter" size={20} color="#666" />
              <Text style={styles.detailText}>@{user.socialMedia.twitter}</Text>
            </View>
          )}
          
          {user?.socialMedia?.facebook && (
            <View style={styles.detailRow}>
              <Ionicons name="logo-facebook" size={20} color="#666" />
              <Text style={styles.detailText}>{user.socialMedia.facebook}</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </>
  );

  const renderEditMode = () => (
    <>
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        <Image
          source={{
            uri: profileImage?.uri || getAvatarUrl(user?.picturePath)
          }}
          style={styles.profileImage}
        />
        <View style={styles.imageOverlay}>
          <Ionicons name="camera" size={32} color="#FFF" />
        </View>
      </TouchableOpacity>

      <View style={styles.form}>
        <Text style={styles.inputLabel}>Name</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Your name"
          placeholderTextColor="#999"
        />

        <Text style={styles.inputLabel}>Username</Text>
        <TextInput
          style={styles.input}
          value={formData.userName}
          onChangeText={(text) => setFormData({ ...formData, userName: text })}
          placeholder="Username"
          placeholderTextColor="#999"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.bio}
          onChangeText={(text) => setFormData({ ...formData, bio: text })}
          placeholder="Tell us about yourself"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.inputLabel}>City</Text>
        <TextInput
          style={styles.input}
          value={formData.city}
          onChangeText={(text) => setFormData({ ...formData, city: text })}
          placeholder="Your city"
          placeholderTextColor="#999"
        />

        <Text style={styles.inputLabel}>Website</Text>
        <TextInput
          style={styles.input}
          value={formData.website}
          onChangeText={(text) => setFormData({ ...formData, website: text })}
          placeholder="Your website"
          placeholderTextColor="#999"
          autoCapitalize="none"
        />

        <Text style={styles.sectionTitle}>Social Media</Text>

        <Text style={styles.inputLabel}>Instagram</Text>
        <TextInput
          style={styles.input}
          value={formData.instagram}
          onChangeText={(text) => setFormData({ ...formData, instagram: text })}
          placeholder="Instagram handle"
          placeholderTextColor="#999"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>TikTok</Text>
        <TextInput
          style={styles.input}
          value={formData.tiktok}
          onChangeText={(text) => setFormData({ ...formData, tiktok: text })}
          placeholder="TikTok handle"
          placeholderTextColor="#999"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>Twitter</Text>
        <TextInput
          style={styles.input}
          value={formData.twitter}
          onChangeText={(text) => setFormData({ ...formData, twitter: text })}
          placeholder="Twitter handle"
          placeholderTextColor="#999"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>Facebook</Text>
        <TextInput
          style={styles.input}
          value={formData.facebook}
          onChangeText={(text) => setFormData({ ...formData, facebook: text })}
          placeholder="Facebook"
          placeholderTextColor="#999"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[styles.editButton, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.editButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        {isEditing && (
          <TouchableOpacity onPress={handleCancel}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isEditing ? renderEditMode() : renderViewMode()}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  imageContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  editButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
});

export default ProfileScreen;