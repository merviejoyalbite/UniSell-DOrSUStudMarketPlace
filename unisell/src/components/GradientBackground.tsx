import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useTheme } from '../theme';

/**
 * Full-screen page wash: mint to pale blue in light mode and deep navy in dark
 * mode. It sits behind every screen inside `ScreenContainer`.
 */
export function GradientBackground() {
  const { gradients } = useTheme();

  return (
    <LinearGradient
      colors={gradients.page}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    />
  );
}
