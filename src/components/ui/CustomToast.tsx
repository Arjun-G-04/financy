import React from 'react';
import { StyleSheet, View, Text, useColorScheme, TouchableOpacity } from 'react-native';
import Toast, { BaseToastProps } from 'react-native-toast-message';
import { Svg, Path } from 'react-native-svg';
import { Colors } from '@/constants/theme';

const fontTitle = 'Outfit-Bold';
const fontLight = 'Outfit-Regular';

interface CustomToastItemProps extends BaseToastProps {
  type: 'success' | 'error' | 'info';
}

function FinancyToast({ text1, text2, type, onPress }: CustomToastItemProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'dark' : scheme];

  const accentColor =
    type === 'success' ? colors.emerald : type === 'error' ? colors.rose : '#818CF8';

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      Toast.hide();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.toastContainer,
        {
          backgroundColor: colors.backgroundElement,
          borderColor: colors.backgroundSelected,
          shadowColor: '#000000',
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      {/* Accent Icon Pill */}
      <View style={[styles.iconContainer, { backgroundColor: accentColor + '1A' }]}>
        {type === 'success' && (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M20 6L9 17L4 12"
              stroke={accentColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
        {type === 'error' && (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 6L6 18M6 6L18 18"
              stroke={accentColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
        {type === 'info' && (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke={accentColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
      </View>

      {/* Content */}
      <View style={styles.textContainer}>
        {text1 ? (
          <Text style={[styles.text1, { color: colors.text }]} numberOfLines={1}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text style={[styles.text2, { color: colors.textSecondary }]} numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export const toastConfig = {
  success: (props: BaseToastProps) => <FinancyToast {...props} type="success" />,
  error: (props: BaseToastProps) => <FinancyToast {...props} type="error" />,
  info: (props: BaseToastProps) => <FinancyToast {...props} type="info" />,
};

const styles = StyleSheet.create({
  toastContainer: {
    width: '92%',
    maxWidth: 420,
    borderRadius: 4,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  text1: {
    fontFamily: fontTitle,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  text2: {
    fontFamily: fontLight,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});
