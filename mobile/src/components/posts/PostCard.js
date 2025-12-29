import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { setPost } from '../../redux/slices/postSlice';
import api from '../../services/api';
import moment from 'moment';

const PostCard = ({ post, onPress, onUserPress }) => {
  const dispatch = useDispatch();
  const loggedInUserId = useSelector((state) => state.auth.user._id);
  
  const isLiked = post.likes?.[loggedInUserId] || false;
  const likeCount = post.likes ? Object.keys(post.likes).length : 0;
  const commentCount = post.comments?.length || 0;

  const handleLike = async () => {
    try {
      const response = await api.patch(`/posts/${post._id}/like`, {
        userId: loggedInUserId,
      });

      if (response.data.success) {
        dispatch(setPost({ post: response.data.post }));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post');
    }
  };

  const getTimeAgo = (createdAt) => {
    return moment(createdAt).fromNow();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => onUserPress?.(post.userId)}
      >
        <Image
          source={{
            uri: post.userPicturePath
              ? `http://localhost:6001/assets/${post.userPicturePath}`
              : 'https://via.placeholder.com/40',
          }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{post.userName}</Text>
          <Text style={styles.timeAgo}>{getTimeAgo(post.createdAt)}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onPress?.(post._id)}>
        {post.subheading && (
          <Text style={styles.subheading}>{post.subheading}</Text>
        )}
        <Text style={styles.description}>{post.description}</Text>

        {post.imagePath && (
          <Image
            source={{
              uri: `http://localhost:6001/assets/${post.imagePath}`,
            }}
            style={styles.postImage}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>

      <View style={styles.actionsBar}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleLike}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={isLiked ? '#FF3B30' : '#000'}
          />
          <Text style={styles.actionText}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onPress?.(post._id)}
        >
          <Ionicons name="chatbubble-outline" size={22} color="#000" />
          <Text style={styles.actionText}>{commentCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="paper-plane-outline" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  subheading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#000',
    paddingHorizontal: 12,
    marginBottom: 12,
    lineHeight: 20,
  },
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F0F0F0',
  },
  actionsBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    fontSize: 14,
    color: '#000',
    marginLeft: 6,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 8,
  },
});

export default PostCard;