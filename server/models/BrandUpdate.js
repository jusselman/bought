import mongoose from 'mongoose';

const brandUpdateSchema = new mongoose.Schema({
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  sourceUrl: {
    type: String,
    required: true,
    trim: true
  },
  updateType: {
    type: String,
    enum: ['product_launch', 'collection', 'press_release', 'event', 'collaboration', 'general'],
    default: 'general'
  },
  publishedDate: {
    type: Date,
    required: true,
    index: true
  },
  // For tracking if we've already fetched this from RSS
  externalId: {
    type: String,
    sparse: true,
    unique: true
  },
  source: {
    type: String,
    enum: ['rss', 'manual', 'api'],
    default: 'rss'
  },
  // For manual posts by admin
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for efficient feed queries
brandUpdateSchema.index({ brandId: 1, publishedDate: -1 });
brandUpdateSchema.index({ publishedDate: -1, isActive: 1 });

// Virtual for time ago display
brandUpdateSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.publishedDate;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
});

// Prevent duplicate RSS entries
brandUpdateSchema.pre('save', async function(next) {
  if (this.isNew && this.externalId) {
    const existing = await this.constructor.findOne({ externalId: this.externalId });
    if (existing) {
      return next(new Error('Duplicate update'));
    }
  }
  next();
});

const BrandUpdate = mongoose.model('BrandUpdate', brandUpdateSchema);

export default BrandUpdate;