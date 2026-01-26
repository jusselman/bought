import { View, Text } from 'react-native';

const PostCard = ({ post }) => {
  return (
    <View style={{ padding: 20, backgroundColor: 'red', margin: 10 }}>
      <Text style={{ color: 'white', fontSize: 20 }}>
        TEST POST: {post.description}
      </Text>
      <Text style={{ color: 'yellow', fontSize: 16 }}>
        IMAGE: {post.imagePath}
      </Text>
    </View>
  );
};

export default PostCard;