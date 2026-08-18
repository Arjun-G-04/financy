import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

const fontTitle = 'Outfit-Bold';
const fontNumber = 'SpaceMono-Bold';

interface DateContextCardProps {
  label: string;
  value: string;
  colors: any;
}

export function DateContextCard({ label, value, colors }: DateContextCardProps) {
  return (
    <View style={[styles.dateContextCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
      <View style={styles.dateContextLeft}>
        <View style={[styles.dateIndicatorDot, { backgroundColor: colors.emerald }]} />
        <Text style={[styles.dateContextLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.dateContextValue, { color: colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dateContextCard: {
    borderRadius: 4,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateContextLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dateContextLabel: {
    fontSize: 10,
    fontFamily: fontTitle,
    letterSpacing: 0.8,
  },
  dateContextValue: {
    fontSize: 12,
    fontFamily: fontNumber,
    letterSpacing: -0.2,
  },
});
