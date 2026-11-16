import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  createThemedStyles,
  fonts,
  fontSizes,
  useTheme,
} from '../theme';
import { getInitials } from '../utils/formatters';
import { VerifiedCheck } from './VerifiedBadge';

interface AvatarProps {
  name: string;
  /** Base64 data URI or remote URL. Missing/null shows initials. */
  photo?: string | null;
  size?: number;
  /** Blue verified check in the bottom-right corner. */
  verified?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Student avatar: gradient initials, or the uploaded profile photo, with an
 * optional blue verified check. Used by Home, Profile, Seller shop and the
 * message thread header.
 */
export function Avatar({
  name,
  photo,
  size = 44,
  verified = false,
  style,
}: AvatarProps) {
  const { colors, gradients } = useTheme();
  const styles = useStyles();
  const checkSize = Math.max(16, Math.round(size * 0.34));
  const initialsSize =
    size >= 72 ? fontSizes.xxl : size >= 52 ? fontSizes.xl : fontSizes.md;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        {photo ? (
          <Image
            source={{ uri: photo }}
            contentFit="cover"
            transition={150}
            style={styles.image}
            accessibilityLabel={`${name}'s profile photo`}
          />
        ) : (
          <>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.image}
            />
            <Text
              accessibilityLabel={`${name}, initials avatar`}
              style={[styles.initials, { fontSize: initialsSize }]}
            >
              {getInitials(name) || '?'}
            </Text>
          </>
        )}
      </View>

      {verified ? (
        <VerifiedCheck size={checkSize} style={styles.verified} />
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.primaryLight,
  },
  image: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  initials: {
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
    color: colors.onPrimary,
  },
  verified: {
    position: 'absolute',
    right: -2,
    bottom: -2,
  },
}));
