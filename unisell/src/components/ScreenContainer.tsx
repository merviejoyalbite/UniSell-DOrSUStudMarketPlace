import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { layout } from '../theme';
import { GradientBackground } from './GradientBackground';
import { ResponsiveContainer } from './ResponsiveContainer';

interface ScreenContainerProps {
  children: ReactNode;
  /** Wrap the content in a ScrollView (use for forms and long feeds). */
  scroll?: boolean;
  /** Apply the standard horizontal page padding. */
  padded?: boolean;
  /** Lift the content above the keyboard (use on form screens). */
  avoidKeyboard?: boolean;
  /** Extra bottom padding, usually the bottom tab bar height. */
  bottomInset?: number;
  /** Override the 1200px content cap (forms use ~720, auth cards ~480). */
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Common page wrapper: safe area + themed background + responsive content
 * width, with optional scrolling and keyboard avoidance. Every screen starts
 * with this component so spacing and max widths stay consistent.
 */
export function ScreenContainer({
  children,
  scroll = false,
  padded = true,
  avoidKeyboard = false,
  bottomInset = 0,
  maxWidth = layout.maxContentWidth,
  style,
}: ScreenContainerProps) {
  const content = (
    <ResponsiveContainer maxWidth={maxWidth} padded={padded} fill>
      <View
        style={[
          styles.inner,
          bottomInset > 0 && { paddingBottom: bottomInset },
          style,
        ]}
      >
        {children}
      </View>
    </ResponsiveContainer>
  );

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {content}
    </ScrollView>
  ) : (
    content
  );

  return (
    <View style={styles.root}>
      <GradientBackground />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {avoidKeyboard ? (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {body}
          </KeyboardAvoidingView>
        ) : (
          body
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
  },
});
