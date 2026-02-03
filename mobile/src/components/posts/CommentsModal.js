import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  InputAccessoryView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { setPost } from '../../redux/slices/postSlice';
import { getImageUrl, getAvatarUrl } from '../../utils/imageUtils';
import api from '../../services/api';
import moment from 'moment';

// Inline CommentItem component to avoid import issues - Memoized to prevent re-renders
const CommentItem = memo(({ comment, currentUserId, onLike }) => {
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
    <View style={commentStyles.container}>
      <Image
        source={{ uri: getAvatarUrl(comment.userPicturePath) }}
        style={commentStyles.avatar}
      />
      <View style={commentStyles.content}>
        <View style={commentStyles.bubble}>
          <Text style={commentStyles.userName}>{comment.userName}</Text>
          <Text style={commentStyles.comment}>{comment.comment}</Text>
        </View>
        
        <View style={commentStyles.footer}>
          <Text style={commentStyles.timeAgo}>{getTimeAgo(comment.createdAt)}</Text>
          
          <TouchableOpacity 
            style={commentStyles.likeButton}
            onPress={handleLike}
            disabled={isLiking}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={14}
              color={isLiked ? '#FF3B30' : '#666'}
            />
            {likeCount > 0 && (
              <Text style={[commentStyles.likeCount, isLiked && commentStyles.likeCountLiked]}>
                {likeCount}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const commentStyles = StyleSheet.create({
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

const CommentsModal = ({ visible, onClose, post }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState(post?.comments || []);
  const [imageLoaded, setImageLoaded] = useState(false);
  const inputRef = useRef(null);
  const flatListRef = useRef(null);

  // Pre-load image when modal becomes visible
  useEffect(() => {
    if (visible && post?.imagePath) {
      setImageLoaded(false);
      // Pre-cache the image
      Image.prefetch(getImageUrl(post.imagePath))
        .then(() => setImageLoaded(true))
        .catch(() => setImageLoaded(true)); // Show even if prefetch fails
    }
  }, [visible, post?.imagePath]);

  // Update local comments when post changes
  useEffect(() => {
    if (post?.comments) {
      setLocalComments(post.comments);
    }
  }, [post?.comments]);

  // Removed auto-focus - let users tap input when ready to comment
  // This prevents keyboard from blocking the view of existing comments

  const handleSubmitComment = async () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    const tempComment = comment.trim();
    setSubmitting(true);
    
    // Optimistically add comment to local state for instant UI feedback
    const optimisticComment = {
      _id: `temp-${Date.now()}`, // Temporary ID
      userId: user._id,
      userName: user.userName,
      userPicturePath: user.picturePath,
      comment: tempComment,
      likes: {},
      createdAt: new Date().toISOString(),
    };
    
    // Clear input immediately for better UX
    setComment('');
    
    // Add optimistic comment
    setLocalComments(prev => [...prev, optimisticComment]);
    
    // Scroll to bottom immediately
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await api.post(`/posts/${post._id}/comments`, {
        userId: user._id,
        comment: tempComment,
      });

      if (response.data.success) {
        // Replace optimistic comment with real one from server
        setLocalComments(response.data.post.comments);
        
        // Update Redux store in background
        dispatch(setPost({ post: response.data.post }));
        
        // Dismiss keyboard
        Keyboard.dismiss();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      // Remove optimistic comment on error
      setLocalComments(prev => prev.filter(c => c._id !== optimisticComment._id));
      // Restore comment text
      setComment(tempComment);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentLike = async (commentId) => {
    try {
      // Optimistically update local state first for instant UI feedback
      setLocalComments(prevComments => 
        prevComments.map(c => {
          if (c._id === commentId) {
            const currentLikes = c.likes || {};
            const isLiked = currentLikes?.[user._id] || false;
            
            const newLikes = { ...currentLikes };
            if (isLiked) {
              delete newLikes[user._id];
            } else {
              newLikes[user._id] = true;
            }
            
            return { ...c, likes: newLikes };
          }
          return c;
        })
      );

      // Then sync with backend
      const response = await api.patch(
        `/posts/${post._id}/comments/${commentId}/like`,
        { userId: user._id }
      );

      if (response.data.success) {
        // Update Redux store in background without triggering re-render
        dispatch(setPost({ post: response.data.post }));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      // Revert optimistic update on error
      if (post?.comments) {
        setLocalComments(post.comments);
      }
      Alert.alert('Error', 'Failed to like comment');
    }
  };

  const renderComment = useCallback(({ item }) => (
    <CommentItem
      comment={item}
      currentUserId={user._id}
      onLike={() => handleCommentLike(item._id)}
    />
  ), [user._id]);

  // Header without image (image is now outside FlatList)
  const renderHeader = useCallback(() => (
    <View>
      {/* Post Info */}
      <View style={styles.postInfo}>
        <View style={styles.postHeader}>
          <Image
            source={{ uri: getAvatarUrl(post?.userPicturePath) }}
            style={styles.postAvatar}
          />
          <View style={styles.postUserInfo}>
            <Text style={styles.postUserName}>{post?.userName}</Text>
            {post?.brandId && (
              <Text style={styles.postBrandName}>{post.brandId.name}</Text>
            )}
          </View>
        </View>
        <Text style={styles.postDescription}>{post?.description}</Text>
      </View>

      {/* Comments Header */}
      <View style={styles.commentsHeader}>
        <Text style={styles.commentsTitle}>
          Comments ({localComments.length})
        </Text>
      </View>
    </View>
  ), [post, localComments.length]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-outline" size={48} color="#CCC" />
      <Text style={styles.emptyText}>No comments yet</Text>
      <Text style={styles.emptySubtext}>Be the first to comment!</Text>
    </View>
  ), []);

  if (!post) return null;

  const inputAccessoryViewID = 'commentInputAccessory';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Comments List */}
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Post Image - Outside FlatList so it never re-renders */}
          {post?.imagePath && (
            <View style={styles.imageContainer}>
              {!imageLoaded && (
                <View style={styles.imagePlaceholder}>
                  <ActivityIndicator size="large" color="#999" />
                </View>
              )}
              <Image
                source={{ uri: getImageUrl(post.imagePath) }}
                style={[styles.postImage, !imageLoaded && styles.imageHidden]}
                resizeMode="cover"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
            </View>
          )}

          <FlatList
            ref={flatListRef}
            data={localComments}
            renderItem={renderComment}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScrollBeginDrag={() => Keyboard.dismiss()}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
          />

          {/* Comment Input */}
          <View style={styles.inputContainer}>
            <Image
              source={{ uri: getAvatarUrl(user.picturePath) }}
              style={styles.inputAvatar}
            />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor="#999"
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
              editable={!submitting}
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={() => Keyboard.dismiss()}
              enablesReturnKeyAutomatically={true}
              inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryViewID : undefined}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!comment.trim() || submitting) && styles.sendButtonDisabled,
              ]}
              onPress={handleSubmitComment}
              disabled={!comment.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={comment.trim() ? '#000' : '#CCC'}
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* iOS Keyboard Accessory - Done Button */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View style={styles.keyboardAccessory}>
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => Keyboard.dismiss()}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSpacer: {
    width: 36,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#F0F0F0',
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    zIndex: 1,
  },
  imageHidden: {
    opacity: 0,
  },
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F0F0F0',
  },
  postInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },
  postUserInfo: {
    marginLeft: 12,
    flex: 1,
  },
  postUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  postBrandName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginTop: 2,
  },
  postDescription: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  commentsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  listContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    marginBottom: 4,
  },
  input: {
    flex: 1,
    marginHorizontal: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    fontSize: 14,
    maxHeight: 100,
    color: '#000',
  },
  sendButton: {
    padding: 8,
    marginBottom: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  keyboardAccessory: {
    backgroundColor: '#F8F8F8',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default CommentsModal;