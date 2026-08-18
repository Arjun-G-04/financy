import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Svg, Path, G, Circle } from 'react-native-svg';

export interface PieChartSlice {
  category: string;
  amount: number;
  color: string;
  percentage: number;
}

interface PieChartProps {
  data: PieChartSlice[];
  size?: number;
  innerRadiusRatio?: number;
  currencySymbol: string;
  totalAmount: number;
  fontTitle?: string;
  fontNumber?: string;
  fontLight?: string;
  textColor?: string;
  textSecondaryColor?: string;
}

import { formatIndianNumber } from '@/utils/format';

export const PieChart: React.FC<PieChartProps> = ({
  data,
  size = 240,
  innerRadiusRatio = 0.65,
  currencySymbol,
  totalAmount,
  fontTitle = 'Outfit-Bold',
  fontNumber = 'SpaceMono-Bold',
  fontLight = 'Outfit-Regular',
  textColor = '#FAFAFA',
  textSecondaryColor = '#A1A1AA',
}) => {
  const center = size / 2;
  const radius = size / 2 - 8;
  const innerRadius = radius * innerRadiusRatio;

  // Render empty state if no data or 0 total
  if (!data || data.length === 0 || totalAmount <= 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={center}
            cy={center}
            r={(radius + innerRadius) / 2}
            stroke="#27272A"
            strokeWidth={radius - innerRadius}
            fill="none"
            strokeDasharray="4 4"
          />
        </Svg>
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { fontFamily: fontLight, color: textSecondaryColor }]}>
            No Data
          </Text>
        </View>
      </View>
    );
  }

  // Handle single item (100%)
  if (data.length === 1) {
    const strokeWidth = radius - innerRadius;
    const ringRadius = (radius + innerRadius) / 2;
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={center}
            cy={center}
            r={ringRadius}
            stroke={data[0].color}
            strokeWidth={strokeWidth}
            fill="none"
          />
        </Svg>
        <View style={styles.centerContainer}>
          <Text style={[styles.totalLabel, { fontFamily: fontLight, color: textSecondaryColor }]}>
            Total Spend
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.totalAmount, { fontFamily: fontNumber, color: textColor }]}
          >
            {currencySymbol}{formatIndianNumber(totalAmount)}
          </Text>
          <Text style={[styles.categoryCount, { fontFamily: fontLight, color: textSecondaryColor }]}>
            1 Category
          </Text>
        </View>
      </View>
    );
  }

  // Calculate slice paths for multiple slices
  let startAngle = -Math.PI / 2; // Start from top 12 o'clock

  const slices = data.map((slice) => {
    const sliceAngle = (slice.percentage / 100) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    const x3 = center + innerRadius * Math.cos(endAngle);
    const y3 = center + innerRadius * Math.sin(endAngle);
    const x4 = center + innerRadius * Math.cos(startAngle);
    const y4 = center + innerRadius * Math.sin(startAngle);

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');

    startAngle = endAngle;

    return {
      pathData,
      color: slice.color,
      category: slice.category,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          {slices.map((slice, index) => (
            <Path
              key={`slice-${index}-${slice.category}`}
              d={slice.pathData}
              fill={slice.color}
              stroke="#09090B"
              strokeWidth={1.5}
            />
          ))}
        </G>
      </Svg>

      <View style={styles.centerContainer}>
        <Text style={[styles.totalLabel, { fontFamily: fontLight, color: textSecondaryColor }]}>
          Total Spend
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.totalAmount, { fontFamily: fontNumber, color: textColor }]}
        >
          {currencySymbol}{formatIndianNumber(totalAmount)}
        </Text>
        <Text style={[styles.categoryCount, { fontFamily: fontLight, color: textSecondaryColor }]}>
          {data.length} {data.length === 1 ? 'Category' : 'Categories'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  centerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60%',
  },
  totalLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 16,
    letterSpacing: -0.5,
  },
  categoryCount: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13,
  },
});
