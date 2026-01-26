import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { addPost } from '../../redux/slices/postSlice';
import api from '../../services/api';

const CreatePostScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [caption, setCaption] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(true);

  useEffect(() => {
    fetchBrands();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload photos'
      );
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await api.get('/brands');
      if (response.data.success) {
        const sortedBrands = response.data.brands.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setBrands(sortedBrands);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      Alert.alert('Error', 'Failed to load brands');
    } finally {
      setLoadingBrands(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPostImage(result.assets[0]);
    }
  };

  const removeImage = () => {
    setPostImage(null);
  };

  const handleCreatePost = async () => {
    // Validation
    if (!selectedBrand) {
      Alert.alert('Missing Information', 'Please select a brand');
      return;
    }

    if (!caption.trim()) {
      Alert.alert('Missing Information', 'Please add a caption');
      return;
    }

    if (!postImage) {
      Alert.alert('Missing Information', 'Please add a photo');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      
      formData.append('userId', user._id);
      formData.append('brandId', selectedBrand);
      formData.append('description', caption.trim());

      const uriParts = postImage.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('picture', {
        uri: postImage.uri,
        name: `post_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      });

      const response = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Add the new post to Redux
        dispatch(addPost(response.data.post));
        
        Alert.alert('Success', 'Post created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create post'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingBrands) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity
          onPress={handleCreatePost}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.postButton}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info */}
        <View style={styles.userInfo}>
          <Image
            source={{
              uri: user?.picturePath
                ? `http://10.0.0.151:6001/assets/${user.picturePath}`
                : 'https://via.placeholder.com/40',
            }}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userHandle}>@{user?.userName}</Text>
          </View>
        </View>

        {/* Brand Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>Brand *</Text>
          <TouchableOpacity
            style={styles.brandSelector}
            onPress={() => {
              Alert.alert(
                'Select Brand',
                '',
                brands.map(brand => ({
                  text: brand.name,
                  onPress: () => setSelectedBrand(brand._id),
                })).concat([{ text: 'Cancel', style: 'cancel' }])
              );
            }}
          >
            <Text style={[styles.brandSelectorText, !selectedBrand && styles.placeholder]}>
              {selectedBrand 
                ? brands.find(b => b._id === selectedBrand)?.name 
                : 'Select a brand...'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Caption Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Caption *</Text>
          <TextInput
            style={styles.captionInput}
            placeholder="What do you think about this brand?"
            placeholderTextColor="#999"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={500}
          />
          <Text style={styles.characterCount}>
            {caption.length}/500
          </Text>
        </View>

        {/* Image Upload */}
        <View style={styles.section}>
          <Text style={styles.label}>Photo *</Text>
          {postImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: postImage.uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={removeImage}
              >
                <Ionicons name="close-circle" size={32} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickImage}
            >
              <Ionicons name="camera" size={40} color="#999" />
              <Text style={styles.uploadText}>Add Photo</Text>
              <Text style={styles.uploadSubtext}>
                Upload a photo with your brand
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Helper Text */}
        <View style={styles.helperContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.helperText}>
            Share your experience with this brand. All fields are required.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    fontSize: 18,
    fontWeight: '600',
  },
  postButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
  },
  userDetails: {
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  captionInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  uploadButton: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  helperText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    lineHeight: 20,
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

export default CreatePostScreen;