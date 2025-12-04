import mongoose from 'mongoose';

const CommentSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userPicturePath: {
    type: String,
    default: ""
  },
  comment: {
    type: String,
    required: true,
    max: 500,
  },
  likes: {
    type: Map,
    of: Boolean,
    default: {}
  },
  // Nested replies (optional - for threaded comments)
  replies: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: String,
    userPicturePath: String,
    comment: {
      type: String,
      required: true,
      max: 500,
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const PostSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userName: {
      type: String,
      required: true,
    },
    userPicturePath: {
      type: String,
      default: ""
    },
    // Post content
    description: {
      type: String,
      required: true,
      max: 2000,
    },
    subheading: {
      type: String,
      max: 200,
      default: ""
    },
    // Post image (optional)
    imagePath: {
      type: String,
      default: ""
    },
    // Related release (optional)
    releaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Release',
      default: null
    },
    // Likes (userId: true/false)
    likes: {
      type: Map,
      of: Boolean,
      default: {}
    },
    // Comments array
    comments: {
      type: [CommentSchema],
      default: [],
    },
    // Post visibility
    isPublic: {
      type: Boolean,
      default: true
    },
    // View count
    views: {
      type: Number,
      default: 0
    },
    // Hashtags
    hashtags: [{
      type: String,
      trim: true
    }],
    // Share count
    shares: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Index for user's posts
PostSchema.index({ userId: 1, createdAt: -1 });

// Index for text search
PostSchema.index({ description: 'text', subheading: 'text' });

// Virtual for like count
PostSchema.virtual('likeCount').get(function() {
  return Array.from(this.likes.values()).filter(val => val === true).length;
});

// Virtual for comment count
PostSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Method to check if user liked the post
PostSchema.methods.isLikedBy = function(userId) {
  return this.likes.get(userId.toString()) === true;
};

// Ensure virtuals are included when converting to JSON
PostSchema.set('toJSON', { virtuals: true });
PostSchema.set('toObject', { virtuals: true });

const Post = mongoose.model("Post", PostSchema);

export default Post;