import { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = new Animated.Value(1); // Start visible
  const scaleAnim = new Animated.Value(1); // Start at full scale

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 3000); // Show for 3 seconds

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.logo}>BOUGHT</Text>
        <Text style={styles.tagline}>Drop Culture, Delivered</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 8,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});

export default SplashScreen;