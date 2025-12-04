import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      min: 2,
      max: 20,
      index: true // For faster queries
    },
    name: {
      type: String,
      required: true,
      trim: true,
      min: 2,
      max: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      max: 100,
      index: true // For faster queries
    },
    password: {
      type: String,
      required: true,
      min: 6,
    },
    picturePath: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      required: false,
      max: 150,
      default: ""
    },
    birthday: {
      type: Date,
      required: false,
    },
    city: {
      type: String,
      required: false,
      max: 50,
    },
    website: {
      type: String,
      required: false,
      max: 100,
    },
    // Social media handles
    socialMedia: {
      instagram: {
        type: String,
        max: 30,
        default: ""
      },
      tiktok: {
        type: String,
        max: 30,
        default: ""
      },
      facebook: {
        type: String,
        max: 50,
        default: ""
      },
      twitter: {
        type: String,
        max: 30,
        default: ""
      }
    },
    // Brands the user follows (references to Brand documents)
    followedBrands: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand'
    }],
    // Users this user follows
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    // Users who follow this user
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    // Mobile-specific fields
    pushToken: {
      type: String,
      default: null // For push notifications (FCM token)
    },
    notificationSettings: {
      merchandiseDrops: {
        type: Boolean,
        default: true
      },
      newFollowers: {
        type: Boolean,
        default: true
      },
      comments: {
        type: Boolean,
        default: true
      },
      likes: {
        type: Boolean,
        default: true
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  { 
    timestamps: true // Creates createdAt and updatedAt automatically
  }
);

// Index for text search on username and name
UserSchema.index({ userName: 'text', name: 'text' });

// Virtual for follower count
UserSchema.virtual('followerCount').get(function() {
  return this.followers.length;
});

// Virtual for following count
UserSchema.virtual('followingCount').get(function() {
  return this.following.length;
});

// Virtual for followed brands count
UserSchema.virtual('followedBrandsCount').get(function() {
  return this.followedBrands.length;
});

// Ensure virtuals are included when converting to JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

const User = mongoose.model("User", UserSchema);

export default User;