import Post from '../models/Post.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

/* CREATE - Create Post */
export const createPost = async (req, res) => {
  try {
    const { 
      userId, 
      description,
      brandId, // for brand posts
      subheading, 
      releaseId,
      hashtags 
    } = req.body;

    console.log('📝 Creating post with data:', req.body);
    console.log('📸 File received:', req.file);
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Validation
    if (!description) {
      return res.status(400).json({
        success: false,
        message: "Description is required"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required"
      });
    }

    const newPost = new Post({
      userId,
      userName: user.userName,
      userPicturePath: user.picturePath,
      description,
      subheading: subheading || "",
      imagePath: req.file.filename, //  Use the uploaded file's filename
      releaseId: releaseId || null,
      brandId: brandId || null, // store brandId if provided
      hashtags: hashtags || [],
      likes: {},
      comments: [],
    });

    await newPost.save();

    // Populate the post with user and release details
    const populatedPost = await Post.findById(newPost._id)
      .populate('userId', 'userName picturePath')
      .populate('releaseId', 'name images brandId');

    console.log('✅ Post created successfully:', populatedPost);

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: populatedPost
    });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* READ - Get Feed Posts */
export const getFeedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'userName picturePath')
      .populate('releaseId', 'name images brandId');

    const total = await Post.countDocuments({ isPublic: true });

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* READ - Get User's Posts */
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('releaseId', 'name images brandId');

    const total = await Post.countDocuments({ userId });

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* READ - Get Single Post */
export const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await Post.findById(postId)
      .populate('userId', 'userName picturePath')
      .populate('releaseId', 'name images brandId price')
      .populate('comments.userId', 'userName picturePath');

    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: "Post not found" 
      });
    }

    // Increment view count
    post.views += 1;
    await post.save();

    res.status(200).json({
      success: true,
      post
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* UPDATE - Like/Unlike Post */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(id);
    
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: "Post not found" 
      });
    }

    const isLiked = post.likes.get(userId);

    if (isLiked) {
      post.likes.delete(userId);
    } else {
      post.likes.set(userId, true);

      // Create notification for post owner (if not liking own post)
      if (post.userId.toString() !== userId) {
        const liker = await User.findById(userId);
        
        await Notification.createNotification({
          recipientId: post.userId,
          senderId: userId,
          senderName: liker.userName,
          senderPicturePath: liker.picturePath,
          type: 'post_like',
          title: 'New Like',
          message: `${liker.userName} liked your post`,
          postId: post._id,
          actionUrl: `/post/${post._id}`
        });
      }
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { likes: post.likes },
      { new: true }
    ).populate('userId', 'userName picturePath');

    res.status(200).json({
      success: true,
      message: isLiked ? "Post unliked" : "Post liked",
      post: updatedPost
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* CREATE - Add Comment */
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, comment } = req.body;

    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: "Post not found" 
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    const newComment = {
      userId,
      userName: user.userName,
      userPicturePath: user.picturePath,
      comment,
      likes: new Map(),
      replies: [],
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    // Create notification for post owner (if not commenting on own post)
    if (post.userId.toString() !== userId) {
      await Notification.createNotification({
        recipientId: post.userId,
        senderId: userId,
        senderName: user.userName,
        senderPicturePath: user.picturePath,
        type: 'post_comment',
        title: 'New Comment',
        message: `${user.userName} commented on your post`,
        postId: post._id,
        actionUrl: `/post/${post._id}`
      });
    }

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'userName picturePath')
      .populate('comments.userId', 'userName picturePath');

    res.status(200).json({
      success: true,
      message: "Comment added successfully",
      post: updatedPost
    });
  } catch (err) {
    console.error('Error in addComment:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* UPDATE - Like/Unlike Comment */
export const likeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: "Post not found" 
      });
    }

    const comment = post.comments.id(commentId);
    
    if (!comment) {
      return res.status(404).json({ 
        success: false,
        message: "Comment not found" 
      });
    }

    const isLiked = comment.likes.get(userId);

    if (isLiked) {
      comment.likes.delete(userId);
    } else {
      comment.likes.set(userId, true);

      // Create notification for comment owner (if not liking own comment)
      if (comment.userId.toString() !== userId) {
        const liker = await User.findById(userId);
        
        await Notification.createNotification({
          recipientId: comment.userId,
          senderId: userId,
          senderName: liker.userName,
          senderPicturePath: liker.picturePath,
          type: 'comment_like',
          title: 'Comment Liked',
          message: `${liker.userName} liked your comment`,
          postId: post._id,
          commentId: commentId,
          actionUrl: `/post/${post._id}`
        });
      }
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: isLiked ? "Comment unliked" : "Comment liked",
      post
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* DELETE - Delete Post */
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: "Post not found" 
      });
    }

    // Check if user is the post owner
    if (post.userId.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: "You can only delete your own posts" 
      });
    }

    await Post.findByIdAndDelete(postId);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully"
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};