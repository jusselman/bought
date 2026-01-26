/* CREATE - Create a new post */
export const createPost = async (req, res) => {
  try {
    const { userId, brandId, description } = req.body;

    console.log('📝 Creating post with data:', { userId, brandId, description });
    console.log('📸 File received:', req.file);

    // Validation
    if (!userId || !brandId || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, brandId, and description are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Picture is required'
      });
    }

    // Create the post
    const newPost = new Post({
      userId,
      brandId,
      description,
      picturePath: req.file.filename,
      likes: {},
      comments: []
    });

    await newPost.save();

    // Populate user and brand details for the response
    const populatedPost = await Post.findById(newPost._id)
      .populate('userId', 'userName name picturePath')
      .populate('brandId', 'name');

    console.log('✅ Post created successfully:', populatedPost);

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: populatedPost
    });
  } catch (error) {
    console.error('❌ Error creating post:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};