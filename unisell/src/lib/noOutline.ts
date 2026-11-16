import { Platform } from 'react-native';

/**
 * Removes the browser's default focus outline on inputs (web only).
 * On native this returns an empty object so it is a no-op.
 *
 * Usage: spread into a TextInput style, e.g.
 *   <TextInput style={[styles.input, noOutline]} />
 */
export const noOutline = Platform.OS === 'web'
  ? ({
      outlineStyle: 'none',
      outlineWidth: 0,
      boxShadow: 'none',
    } as any)
  : {};
