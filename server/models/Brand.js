import mongoose from "mongoose";

const BrandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      min: 2,
      max: 50,
      index: true
    },
    description: {
      type: String,
      required: true,
      max: 500,
    },
    logoPath: {
      type: String,
      required: true,
    },
    websiteUrl: {
      type: String,
      required: true,
      max: 200,
    },
    // Social media links
    socialMedia: {
      instagram: String,
      tiktok: String,
      twitter: String,
      facebook: String
    },
    // Brand category
    category: {
      type: String,
      enum: ['Streetwear', 'Luxury', 'Athletic', 'Accessories', 'Footwear', 'Other'],
      default: 'Other'
    },
    // Users following this brand
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    // Is this brand verified?
    isVerified: {
      type: Boolean,
      default: false
    },
    // Last time brand info was updated
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Index for text search
BrandSchema.index({ name: 'text', description: 'text' });

// Virtual for follower count
BrandSchema.virtual('followerCount').get(function() {
  return this.followers.length;
});

// Ensure virtuals are included when converting to JSON
BrandSchema.set('toJSON', { virtuals: true });
BrandSchema.set('toObject', { virtuals: true });

const Brand = mongoose.model("Brand", BrandSchema);

export default Brand;