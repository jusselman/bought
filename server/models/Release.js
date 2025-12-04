import mongoose from "mongoose";

const ReleaseSchema = new mongoose.Schema(
  {
    // Reference to the brand
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true
    },
    // Release details
    name: {
      type: String,
      required: true,
      trim: true,
      max: 100,
    },
    description: {
      type: String,
      required: true,
      max: 1000,
    },
    // Release images
    images: [{
      type: String,
      required: true
    }],
    // Price information
    price: {
      type: Number,
      required: false,
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']
    },
    // Release date/time
    releaseDate: {
      type: Date,
      required: true,
      index: true
    },
    // Where to buy
    purchaseUrl: {
      type: String,
      required: true,
      max: 300,
    },
    // Category of merchandise
    category: {
      type: String,
      enum: ['Clothing', 'Footwear', 'Accessories', 'Collaboration', 'Limited Edition', 'Other'],
      default: 'Other'
    },
    // Is this a limited release?
    isLimited: {
      type: Boolean,
      default: false
    },
    // Stock status
    stockStatus: {
      type: String,
      enum: ['Coming Soon', 'Available', 'Low Stock', 'Sold Out'],
      default: 'Coming Soon'
    },
    // Users who saved/bookmarked this release
    savedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    // View count
    views: {
      type: Number,
      default: 0
    },
    // Last time this release was updated
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    // Has notification been sent?
    notificationSent: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Index for querying upcoming releases
ReleaseSchema.index({ releaseDate: 1, stockStatus: 1 });

// Index for text search
ReleaseSchema.index({ name: 'text', description: 'text' });

// Virtual for save count
ReleaseSchema.virtual('saveCount').get(function() {
  return this.savedBy.length;
});

// Method to check if release is upcoming
ReleaseSchema.methods.isUpcoming = function() {
  return this.releaseDate > new Date();
};

// Method to check if release is active (available now)
ReleaseSchema.methods.isActive = function() {
  const now = new Date();
  return this.releaseDate <= now && this.stockStatus !== 'Sold Out';
};

// Ensure virtuals are included when converting to JSON
ReleaseSchema.set('toJSON', { virtuals: true });
ReleaseSchema.set('toObject', { virtuals: true });

const Release = mongoose.model("Release", ReleaseSchema);

export default Release;