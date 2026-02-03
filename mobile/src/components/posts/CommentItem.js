import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAvatarUrl } from '../../utils/imageUtils';
import moment from 'moment';

const CommentItem = ({ comment, currentUserId, onLike }) => {
  const [isLiking, setIsLiking] = useState(false);
  
  const isLiked = comment.likes?.get?.(currentUserId) || 
                  comment.likes?.[currentUserId] || 
                  false;
  
  const likeCount = comment.likes 
    ? (comment.likes instanceof Map 
        ? Array.from(comment.likes.values()).filter(val => val === true).length
        : Object.values(comment.likes).filter(val => val === true).length)
    : 0;

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    await onLike();
    setIsLiking(false);
  };

  const getTimeAgo = (createdAt) => {
    return moment(createdAt).fromNow();
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: getAvatarUrl(comment.userPicturePath) }}
        style={styles.avatar}
      />
      <View style={styles.content}>
        <View style={styles.bubble}>
          <Text style={styles.userName}>{comment.userName}</Text>
          <Text style={styles.comment}>{comment.comment}</Text>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.timeAgo}>{getTimeAgo(comment.createdAt)}</Text>
          
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={handleLike}
            disabled={isLiking}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={14}
              color={isLiked ? '#FF3B30' : '#666'}
            />
            {likeCount > 0 && (
              <Text style={[styles.likeCount, isLiked && styles.likeCountLiked]}>
                {likeCount}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  bubble: {
    backgroundColor: '#F0F0F0',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  comment: {
    fontSize: 14,
    color: '#000',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 16,
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  likeCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  likeCountLiked: {
    color: '#FF3B30',
  },
});

export default CommentItem;