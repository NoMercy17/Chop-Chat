import { Dimensions } from 'react-native';

// Base: iPhone 14/15 Pro (393 x 852)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Scale width-based values (padding, margins, widths, borderRadius)
export const wp = (size) => Math.round((size / BASE_WIDTH) * SCREEN_WIDTH);

// Scale height-based values (vertical padding, heights)
export const hp = (size) => Math.round((size / BASE_HEIGHT) * SCREEN_HEIGHT);

// Scale fonts (capped at 1.3x for tablets)
export const fp = (size) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size * Math.min(scale, 1.3));
};

// Spacing constants for consistency
export const SPACING = {
  screenPadding: wp(16),
  sectionGap: hp(20),
  itemGap: hp(12),
  cardPadding: wp(16),
  radiusSmall: wp(8),
  radiusMedium: wp(12),
  radiusLarge: wp(16),
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };
