import { View, Text, StyleSheet } from 'react-native';

const ReleasesScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Releases</Text>
      <Text style={styles.subtitle}>Upcoming merchandise drops</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
});

export default ReleasesScreen;