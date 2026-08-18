import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  LayoutChangeEvent,
  TouchableOpacity,
} from 'react-native';
import { Svg, Path, Defs, LinearGradient, Stop, Line, Circle, G, Rect, Text as SvgText } from 'react-native-svg';

export interface DailySpendPoint {
  date: string; // YYYY-MM-DD
  dayNum: number; // day number 1-31
  monthNum: number; // month number 1-12
  isWeekend: boolean; // Saturday or Sunday
  amount: number;
}

interface LineChartProps {
  data: DailySpendPoint[];
  currencySymbol: string;
  height?: number;
  accentColor?: string;
  textColor?: string;
  textSecondaryColor?: string;
  gridColor?: string;
  weekendHighlightColor?: string;
  fontTitle?: string;
  fontNumber?: string;
  fontLight?: string;
}

import { formatCompactNumber, formatIndianNumber } from '@/utils/format';

export const LineChart: React.FC<LineChartProps> = ({
  data,
  currencySymbol,
  height = 220,
  accentColor = '#10B981',
  textColor = '#FAFAFA',
  textSecondaryColor = '#A1A1AA',
  gridColor = 'rgba(255, 255, 255, 0.08)',
  weekendHighlightColor = 'rgba(251, 113, 133, 0.08)',
  fontTitle = 'Outfit-Bold',
  fontNumber = 'SpaceMono-Bold',
  fontLight = 'Outfit-Regular',
}) => {
  const [chartWidth, setChartWidth] = useState<number>(320);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      setChartWidth(w);
    }
  };

  const paddingLeft = 48;
  const paddingRight = 14;
  const paddingTop = 16;
  const paddingBottom = 26;

  const innerWidth = Math.max(chartWidth - paddingLeft - paddingRight, 10);
  const innerHeight = Math.max(height - paddingTop - paddingBottom, 10);

  // Calculate max spend for Y scale with 5 intervals (6 ticks: 0, 20%, 40%, 60%, 80%, 100%)
  const { maxAmount, yGridTicks } = useMemo(() => {
    if (!data || data.length === 0) {
      return { maxAmount: 100, yGridTicks: [0, 20, 40, 60, 80, 100] };
    }
    const max = Math.max(...data.map((d) => d.amount), 0);
    let ceil = max > 0 ? max : 100;
    const magnitude = Math.pow(10, Math.floor(Math.log10(ceil)));
    const normalized = ceil / magnitude;

    let roundedUpper = 1;
    if (normalized <= 1) roundedUpper = 1;
    else if (normalized <= 2) roundedUpper = 2;
    else if (normalized <= 2.5) roundedUpper = 2.5;
    else if (normalized <= 5) roundedUpper = 5;
    else roundedUpper = 10;

    const targetMax = Math.max(roundedUpper * magnitude, 10);

    // 5 intervals (6 ticks from 0 to targetMax)
    const ticks = [
      0,
      targetMax * 0.2,
      targetMax * 0.4,
      targetMax * 0.6,
      targetMax * 0.8,
      targetMax,
    ];

    return { maxAmount: targetMax, yGridTicks: ticks };
  }, [data]);

  // Compute (X, Y) coordinates for data points
  const points = useMemo(() => {
    if (!data || data.length === 0) return [];

    const n = data.length;
    return data.map((d, i) => {
      const x = n === 1 ? paddingLeft + innerWidth / 2 : paddingLeft + (i / (n - 1)) * innerWidth;
      const yRatio = maxAmount > 0 ? d.amount / maxAmount : 0;
      const y = paddingTop + innerHeight - yRatio * innerHeight;
      return {
        x,
        y,
        date: d.date,
        dayNum: d.dayNum,
        monthNum: d.monthNum,
        isWeekend: d.isWeekend,
        amount: d.amount,
        index: i,
      };
    });
  }, [data, innerWidth, innerHeight, maxAmount, paddingLeft, paddingTop]);

  // Generate Smooth Bezier Spline paths (no sharp corners)
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' };

    if (points.length === 1) {
      const p = points[0];
      const lPath = `M ${paddingLeft} ${p.y} L ${paddingLeft + innerWidth} ${p.y}`;
      const aPath = `M ${paddingLeft} ${p.y} L ${paddingLeft + innerWidth} ${p.y} L ${paddingLeft + innerWidth} ${paddingTop + innerHeight} L ${paddingLeft} ${paddingTop + innerHeight} Z`;
      return { linePath: lPath, areaPath: aPath };
    }

    if (points.length === 2) {
      const p0 = points[0];
      const p1 = points[1];
      const lPath = `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y}`;
      const aPath = `${lPath} L ${p1.x} ${paddingTop + innerHeight} L ${p0.x} ${paddingTop + innerHeight} Z`;
      return { linePath: lPath, areaPath: aPath };
    }

    // Catmull-Rom to Cubic Bezier spline smoothing
    let lPath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i + 2 < points.length ? points[i + 2] : p2;

      // Clamped control points for smooth tension
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      lPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const last = points[points.length - 1];
    const first = points[0];
    const aPath = `${lPath} L ${last.x} ${paddingTop + innerHeight} L ${first.x} ${paddingTop + innerHeight} Z`;

    return { linePath: lPath, areaPath: aPath };
  }, [points, innerWidth, innerHeight, paddingLeft, paddingTop]);

  // Sample X Axis Ticks so labels don't collide
  const xTicks = useMemo(() => {
    if (points.length === 0) return [];
    if (points.length <= 6) return points;

    const tickCount = Math.min(6, points.length);
    const step = (points.length - 1) / (tickCount - 1);
    const selected: typeof points = [];
    for (let i = 0; i < tickCount; i++) {
      const idx = Math.round(i * step);
      if (points[idx] && !selected.some((p) => p.index === idx)) {
        selected.push(points[idx]);
      }
    }
    return selected;
  }, [points]);

  const activePoint = selectedIndex !== null && points[selectedIndex] ? points[selectedIndex] : null;
  const colWidth = points.length > 1 ? innerWidth / (points.length - 1) : innerWidth;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Active Point Detail Tooltip */}
      {activePoint ? (
        <View style={[styles.activeTooltip, { backgroundColor: '#18181B', borderColor: accentColor }]}>
          <View style={styles.tooltipLeft}>
            <Text style={[styles.tooltipDate, { color: textSecondaryColor, fontFamily: fontLight }]}>
              {activePoint.date}
            </Text>
            {activePoint.isWeekend && (
              <View style={styles.weekendTag}>
                <Text style={styles.weekendTagText}>Weekend</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tooltipAmount, { color: textColor, fontFamily: fontNumber }]}>
            {currencySymbol}{formatIndianNumber(activePoint.amount)}
          </Text>
        </View>
      ) : (
        <View style={styles.tooltipPlaceholder}>
          <Text style={[styles.hintText, { color: textSecondaryColor, fontFamily: fontLight }]}>
            Tap any day on the curve to view spend
          </Text>
        </View>
      )}

      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="spendGradSmooth" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={accentColor} stopOpacity={0.35} />
            <Stop offset="75%" stopColor={accentColor} stopOpacity={0.05} />
            <Stop offset="100%" stopColor={accentColor} stopOpacity={0.0} />
          </LinearGradient>
        </Defs>

        {/* Weekend shaded vertical background columns */}
        {points.map((p, i) => {
          if (!p.isWeekend) return null;
          const rectX = p.x - colWidth / 2;
          return (
            <Rect
              key={`wknd-bg-${i}`}
              x={Math.max(rectX, paddingLeft)}
              y={paddingTop}
              width={colWidth}
              height={innerHeight}
              fill={weekendHighlightColor}
            />
          );
        })}

        {/* Horizontal Grid lines & Exact aligned Y-axis labels inside SVG */}
        {yGridTicks.map((val, i) => {
          const yRatio = maxAmount > 0 ? val / maxAmount : 0;
          const y = paddingTop + innerHeight - yRatio * innerHeight;

          return (
            <G key={`y-grid-${i}`}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={paddingLeft + innerWidth}
                y2={y}
                stroke={gridColor}
                strokeWidth={val === 0 ? 1.2 : 0.8}
                strokeDasharray={val === 0 ? undefined : '3 3'}
              />
              <SvgText
                x={paddingLeft - 8}
                y={y + 3.5}
                fontSize="9"
                fill={textSecondaryColor}
                textAnchor="end"
                fontFamily={fontNumber}
              >
                {formatCompactNumber(val)}
              </SvgText>
            </G>
          );
        })}

        {/* Shaded Area under smooth curve */}
        {areaPath ? (
          <Path d={areaPath} fill="url(#spendGradSmooth)" />
        ) : null}

        {/* Smooth Line Stroke */}
        {linePath ? (
          <Path
            d={linePath}
            stroke={accentColor}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Active Point Highlight */}
        {activePoint ? (
          <G>
            <Line
              x1={activePoint.x}
              y1={paddingTop}
              x2={activePoint.x}
              y2={paddingTop + innerHeight}
              stroke={accentColor}
              strokeWidth={1}
              strokeDasharray="2 2"
              opacity={0.6}
            />
            <Circle
              cx={activePoint.x}
              cy={activePoint.y}
              r={5.5}
              fill={accentColor}
              stroke="#09090B"
              strokeWidth={2}
            />
          </G>
        ) : null}
      </Svg>

      {/* X Axis Labels: only date and month numbers (e.g. 1/8, 15/8), highlighting weekends */}
      <View style={[styles.xAxisContainer, { left: paddingLeft, width: innerWidth, bottom: 2 }]}>
        {xTicks.map((tick, i) => {
          const isSelected = selectedIndex === tick.index;
          const isWknd = tick.isWeekend;

          return (
            <TouchableOpacity
              key={`xtick-${i}-${tick.index}`}
              onPress={() => setSelectedIndex(selectedIndex === tick.index ? null : tick.index)}
              activeOpacity={0.7}
              style={[
                styles.xTickButton,
                isWknd && styles.weekendTickBadge,
              ]}
            >
              <Text
                style={[
                  styles.xAxisLabel,
                  {
                    color: isSelected
                      ? accentColor
                      : isWknd
                      ? '#FB7185'
                      : textSecondaryColor,
                    fontFamily: isSelected || isWknd ? fontTitle : fontLight,
                  },
                ]}
              >
                {`${tick.dayNum}/${tick.monthNum}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Invisible Touch overlay columns */}
      <View style={[styles.touchOverlay, { left: paddingLeft, width: innerWidth, top: paddingTop, height: innerHeight }]}>
        {points.map((p, i) => (
          <TouchableOpacity
            key={`touch-${i}`}
            style={styles.touchColumn}
            onPress={() => setSelectedIndex(selectedIndex === i ? null : i)}
            activeOpacity={1}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 8,
  },
  tooltipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekendTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 2,
    backgroundColor: 'rgba(251, 113, 133, 0.2)',
  },
  weekendTagText: {
    fontSize: 9,
    color: '#FB7185',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tooltipPlaceholder: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tooltipDate: {
    fontSize: 11,
  },
  tooltipAmount: {
    fontSize: 13,
  },
  hintText: {
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.7,
  },
  xAxisContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xTickButton: {
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 2,
  },
  weekendTickBadge: {
    backgroundColor: 'rgba(251, 113, 133, 0.12)',
  },
  xAxisLabel: {
    fontSize: 9.5,
  },
  touchOverlay: {
    position: 'absolute',
    flexDirection: 'row',
  },
  touchColumn: {
    flex: 1,
    height: '100%',
  },
});
