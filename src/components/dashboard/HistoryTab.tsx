import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  useColorScheme,
} from 'react-native';
import { LocalTransaction } from '@/services/database';
import { Colors, Spacing } from '@/constants/theme';
import { isIncomeCategory } from '@/utils/category';
import { formatIndianNumber, formatDateToYMD } from '@/utils/format';
import { useAnalyticsFilter } from '@/hooks/useAnalyticsFilter';
import { LineChart, DailySpendPoint } from './LineChart';
import { DateContextCard } from './DateContextCard';
import { AnalyticsFilterPanel } from './AnalyticsFilterPanel';

interface HistoryTabProps {
  localTransactions: LocalTransaction[];
  currencySymbol: string;
}

const fontTitle = 'Outfit-Bold';
const fontLight = 'Outfit-Regular';
const fontNumber = 'SpaceMono-Bold';

export function HistoryTab({ localTransactions, currencySymbol }: HistoryTabProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'dark' : scheme];

  const filter = useAnalyticsFilter(localTransactions);

  // Aggregate daily spend for enabled categories across the date range
  const { chartData, totalSpend, dailyAvg, peakAmount } = useMemo(() => {
    const spendByDate: Record<string, number> = {};

    for (const tx of localTransactions) {
      const category = tx.category?.trim() || 'Uncategorized';

      if (isIncomeCategory(category)) continue;
      if (filter.filterStartDate && tx.date < filter.filterStartDate) continue;
      if (filter.filterEndDate && tx.date > filter.filterEndDate) continue;
      if (filter.disabledCategories.has(category)) continue;

      const amt = Math.abs(tx.amount);
      spendByDate[tx.date] = (spendByDate[tx.date] || 0) + amt;
    }

    const points: DailySpendPoint[] = [];
    let sum = 0;
    let maxSpend = 0;

    if (filter.filterStartDate && filter.filterEndDate) {
      const startParts = filter.filterStartDate.split('-').map(Number);
      const endParts = filter.filterEndDate.split('-').map(Number);
      const cur = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);

      let count = 0;
      while (cur <= end && count < 400) {
        const ymd = formatDateToYMD(cur);
        const dayNum = cur.getDate();
        const monthNum = cur.getMonth() + 1;
        const isWknd = cur.getDay() === 0 || cur.getDay() === 6;

        const amt = spendByDate[ymd] || 0;
        sum += amt;
        if (amt > maxSpend) {
          maxSpend = amt;
        }

        points.push({
          date: ymd,
          dayNum,
          monthNum,
          isWeekend: isWknd,
          amount: amt,
        });

        cur.setDate(cur.getDate() + 1);
        count++;
      }
    }

    const avg = points.length > 0 ? sum / points.length : 0;

    return {
      chartData: points,
      totalSpend: sum,
      dailyAvg: avg,
      peakAmount: maxSpend,
    };
  }, [localTransactions, filter.filterStartDate, filter.filterEndDate, filter.disabledCategories]);

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Spend History</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Daily spending trend across selected categories
        </Text>
      </View>

      {/* Prominent Date Range Badge */}
      <DateContextCard
        label={filter.displayRangeLabel}
        value={filter.displayRangeValue}
        colors={colors}
      />

      {/* Summary Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          <Text style={[styles.metricCardLabel, { color: colors.textSecondary }]}>Total Spend</Text>
          <Text style={[styles.metricCardValue, { color: colors.text }]}>
            {currencySymbol}{formatIndianNumber(totalSpend)}
          </Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          <Text style={[styles.metricCardLabel, { color: colors.textSecondary }]}>Daily Average</Text>
          <Text style={[styles.metricCardValue, { color: colors.text }]}>
            {currencySymbol}{formatIndianNumber(dailyAvg)}
          </Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          <Text style={[styles.metricCardLabel, { color: colors.textSecondary }]}>Peak Day</Text>
          <Text style={[styles.metricCardValue, { color: colors.rose }]}>
            {currencySymbol}{formatIndianNumber(peakAmount)}
          </Text>
        </View>
      </View>

      {/* Shaded Gradient Line Chart Card */}
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleRow}>
            <View style={[styles.chartIndicatorDot, { backgroundColor: colors.emerald }]} />
            <Text style={[styles.chartTitle, { color: colors.text }]}>Daily Spend Trend</Text>
          </View>
        </View>

        <View style={styles.chartWrapper}>
          <LineChart
            data={chartData}
            currencySymbol={currencySymbol}
            height={220}
            accentColor={colors.emerald}
            textColor={colors.text}
            textSecondaryColor={colors.textSecondary}
          />
        </View>
      </View>

      {/* Filter & Edit Options Collapsible Panel */}
      <AnalyticsFilterPanel
        colors={colors}
        scheme={scheme || 'dark'}
        isFilterPanelExpanded={filter.isFilterPanelExpanded}
        setIsFilterPanelExpanded={filter.setIsFilterPanelExpanded}
        datePreset={filter.datePreset}
        setDatePreset={filter.setDatePreset}
        customStartDate={filter.customStartDate}
        setCustomStartDate={filter.setCustomStartDate}
        customEndDate={filter.customEndDate}
        setCustomEndDate={filter.setCustomEndDate}
        activeDatePicker={filter.activeDatePicker}
        setActiveDatePicker={filter.setActiveDatePicker}
        allAvailableCategories={filter.allAvailableCategories}
        disabledCategories={filter.disabledCategories}
        categoryColorMap={filter.categoryColorMap}
        handleToggleCategory={filter.handleToggleCategory}
        handleSelectAllCategories={filter.handleSelectAllCategories}
        handleDeselectAllCategories={filter.handleDeselectAllCategories}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  header: {
    marginBottom: Spacing.one,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: fontTitle,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: fontLight,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    borderRadius: 4,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 4,
  },
  metricCardLabel: {
    fontSize: 10,
    fontFamily: fontLight,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricCardValue: {
    fontSize: 13,
    fontFamily: fontNumber,
    letterSpacing: -0.4,
  },
  card: {
    borderRadius: 4,
    borderWidth: 1,
    padding: Spacing.three,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chartTitle: {
    fontSize: 13,
    fontFamily: fontTitle,
    letterSpacing: -0.2,
  },
  chartWrapper: {
    paddingVertical: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
