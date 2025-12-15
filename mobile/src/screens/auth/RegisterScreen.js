import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Formik } from 'formik';
import * as yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch } from 'react-redux';
import { setLogin } from '../../redux/slices/authSlice';
import api from '../../services/api';

const registerSchema = yup.object().shape({
  userName: yup.string().required('Username is required'),
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  birthday: yup.string(),
  bio: yup.string(),
  website: yup.string(),
  city: yup.string(),
  instagram: yup.string(),
  tiktok: yup.string(),
  facebook: yup.string(),
  twitter: yup.string(),
});

const RegisterScreen = ({ navigation }) => {
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const pickImage = async (setFieldValue) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0]);
      setFieldValue('picture', result.assets[0]);
    }
  };

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add all text fields
      Object.keys(values).forEach((key) => {
        if (key !== 'picture' && values[key]) {
          formData.append(key, values[key]);
        }
      });

      // Add profile picture if selected
      if (profileImage) {
        const uriParts = profileImage.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('picture', {
          uri: profileImage.uri,
          name: `profile.${fileType}`,
          type: `image/${fileType}`,
        });
        formData.append('picturePath', `profile.${fileType}`);
      }

      // Add nested socialMedia object
      formData.append('socialMedia', JSON.stringify({
        instagram: values.instagram || '',
        tiktok: values.tiktok || '',
        facebook: values.facebook || '',
        twitter: values.twitter || '',
      }));

      const response = await api.post('/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        Alert.alert('Success', 'Registration successful! Please login.');
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the drop culture</Text>
        </View>

        <Formik
          initialValues={{
            userName: '',
            name: '',
            email: '',
            password: '',
            birthday: '',
            bio: '',
            website: '',
            city: '',
            instagram: '',
            tiktok: '',
            facebook: '',
            twitter: '',
            picture: null,
          }}
          validationSchema={registerSchema}
          onSubmit={handleRegister}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
          }) => (
            <View style={styles.form}>
              {/* Profile Picture */}
              <TouchableOpacity
                style={styles.imagePickerContainer}
                onPress={() => pickImage(setFieldValue)}
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage.uri }} style={styles.profileImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>+</Text>
                    <Text style={styles.imageLabel}>Add Profile Photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Required Fields */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Required Information</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#999"
                  value={values.userName}
                  onChangeText={handleChange('userName')}
                  onBlur={handleBlur('userName')}
                  autoCapitalize="none"
                />
                {touched.userName && errors.userName && (
                  <Text style={styles.errorText}>{errors.userName}</Text>
                )}

                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#999"
                  value={values.name}
                  onChangeText={handleChange('name')}
                  onBlur={handleBlur('name')}
                />
                {touched.name && errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}

                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {touched.email && errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}

                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  secureTextEntry
                />
                {touched.password && errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Optional Fields */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Info (Optional)</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Birthday (MM/DD/YYYY)"
                  placeholderTextColor="#999"
                  value={values.birthday}
                  onChangeText={handleChange('birthday')}
                  onBlur={handleBlur('birthday')}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Bio"
                  placeholderTextColor="#999"
                  value={values.bio}
                  onChangeText={handleChange('bio')}
                  onBlur={handleBlur('bio')}
                  multiline
                  numberOfLines={3}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Website"
                  placeholderTextColor="#999"
                  value={values.website}
                  onChangeText={handleChange('website')}
                  onBlur={handleBlur('website')}
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor="#999"
                  value={values.city}
                  onChangeText={handleChange('city')}
                  onBlur={handleBlur('city')}
                />
              </View>

              {/* Social Media */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Social Media</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Instagram Handle"
                  placeholderTextColor="#999"
                  value={values.instagram}
                  onChangeText={handleChange('instagram')}
                  onBlur={handleBlur('instagram')}
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="TikTok Handle"
                  placeholderTextColor="#999"
                  value={values.tiktok}
                  onChangeText={handleChange('tiktok')}
                  onBlur={handleBlur('tiktok')}
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Facebook"
                  placeholderTextColor="#999"
                  value={values.facebook}
                  onChangeText={handleChange('facebook')}
                  onBlur={handleBlur('facebook')}
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Twitter Handle"
                  placeholderTextColor="#999"
                  value={values.twitter}
                  onChangeText={handleChange('twitter')}
                  onBlur={handleBlur('twitter')}
                  autoCapitalize="none"
                />
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Creating Account...' : 'REGISTER'}
                </Text>
              </TouchableOpacity>

              {/* Login Link */}
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>
                  Already have an account? <Text style={styles.linkBold}>Login here</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  form: {
    width: '100%',
  },
  imagePickerContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 48,
    color: '#CCCCCC',
  },
  imageLabel: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#000000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  linkText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 14,
  },
  linkBold: {
    fontWeight: '600',
    color: '#000000',
  },
});

export default RegisterScreen;