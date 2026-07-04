import { Dimensions } from 'react-native';

// Base: iPhone 14/15 Pro (393 x 852)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

// Get dynamic width/height on demand inside the functions instead of a static top-level call. Allows responding to orientation changes dynamically.

// Scale width-based values (padding, margins, widths, borderRadius)
export const wp = (size) => {
  const { width } = Dimensions.get('window');
  return Math.round((size / BASE_WIDTH) * width);
};

// Scale height-based values (vertical padding, heights)
export const hp = (size) => {
  const { height } = Dimensions.get('window');
  return Math.round((size / BASE_HEIGHT) * height);
};

// Scale fonts (capped at 1.3x for tablets)
export const fp = (size) => {
  const { width } = Dimensions.get('window');
  const scale = width / BASE_WIDTH;
  return Math.round(size * Math.min(scale, 1.3));
};

// Constants that rely on functions which now compute dynamically
export const SPACING = {
  screenPadding: wp(16),
  sectionGap: hp(20),
  itemGap: hp(12),
  cardPadding: wp(16),
  radiusSmall: wp(8),
  radiusMedium: wp(12),
  radiusLarge: wp(16),
};

export const getScreenWidth = () => Dimensions.get('window').width;
export const getScreenHeight = () => Dimensions.get('window').height;
