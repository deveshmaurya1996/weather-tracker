import React, { useEffect, useRef } from 'react';
import { 
  View,  
  Text,
  StyleSheet, 
  Animated, 
  Platform,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface LoaderProps {
  text?: string;
  visible?: boolean;
  overlay?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ 
  text, 
  visible = true,
}) => {
  const { colors, theme } = useTheme();
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    rotation.start();
    return () => rotation.stop();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const content = (
    <View style={styles.content}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <MaterialCommunityIcons 
          name="weather-partly-cloudy" 
          size={48} 
          color={colors.primary} 
        />
      </Animated.View>

      {text && (
        <Text style={[styles.text,{color: colors.primary}]}>{text}</Text>
      )}
    </View>
  );

  if (!visible) return null;

  return (
    <View style={[styles.container,{backgroundColor:colors.background}]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
  },
});

export default Loader;