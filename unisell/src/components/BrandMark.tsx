import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { colors, radii } from '../theme';

interface BrandMarkProps {
  size?: number;
  /** Override the corner radius (Home uses the Figma 18 px header tile). */
  radius?: number;
}

/**
 * The UniSell logo mark: a rounded teal square with a graduation cap.
 * Reused on the Welcome screen and placeholder pages.
 */
export function BrandMark({ size = 72, radius }: BrandMarkProps) {
  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: radius ?? size * 0.28 },
      ]}
    >
      <Ionicons name="school" size={size * 0.5} color={colors.textOnPrimary} />
      <View
        style={[
          styles.dot,
          {
            width: size * 0.18,
            height: size * 0.18,
            borderRadius: size * 0.09,
            right: size * 0.16,
            bottom: size * 0.16,
          },
        ]}
      >
        <Ionicons name="checkmark" size={size * 0.12} color={colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
