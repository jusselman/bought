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
      index: true
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
      index: true
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
    // Now using proper ObjectIds since brand IDs are ObjectIds
    followedBrands: [{
      type: mongoose.Schema.Types.ObjectId,
      // No ref since brands are in JSON for now, but ready for MongoDB migration
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    pushToken: {
      type: String,
      default: null
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
    timestamps: true
  }
);

UserSchema.index({ userName: 'text', name: 'text' });

UserSchema.virtual('followerCount').get(function() {
  return this.followers?.length || 0;
});

UserSchema.virtual('followingCount').get(function() {
  return this.following?.length || 0;
});

UserSchema.virtual('followedBrandsCount').get(function() {
  return this.followedBrands?.length || 0;
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

const User = mongoose.model("User", UserSchema);

export default User;