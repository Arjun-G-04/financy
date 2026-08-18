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
import { formatIndianNumber } from '@/utils/format';
import { useAnalyticsFilter } from '@/hooks/useAnalyticsFilter';
import { PieChart, PieChartSlice } from './PieChart';
import { DateContextCard } from './DateContextCard';
import { AnalyticsFilterPanel } from './AnalyticsFilterPanel';

interface AnalyticsTabProps {
  localTransactions: LocalTransaction[];
  currencySymbol: string;
}

const fontTitle = 'Outfit-Bold';
const fontLight = 'Outfit-Regular';
const fontNumber = 'SpaceMono-Bold';

export function AnalyticsTab({ localTransactions, currencySymbol }: AnalyticsTabProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'dark' : scheme];

  const filter = useAnalyticsFilter(localTransactions);

  // Filter transactions: date range + non-income + enabled categories only
  const categoryStats = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    let totalSpend = 0;

    for (const tx of localTransactions) {
      const category = tx.category?.trim() || 'Uncategorized';

      if (isIncomeCategory(category)) continue;
      if (filter.filterStartDate && tx.date < filter.filterStartDate) continue;
      if (filter.filterEndDate && tx.date > filter.filterEndDate) continue;
      if (filter.disabledCategories.has(category)) continue;

      const amount = Math.abs(tx.amount);
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      totalSpend += amount;
    }

    const sortedCategories = Object.keys(categoryTotals)
      .map((cat) => {
        const amount = categoryTotals[cat];
        const percentage = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;
        return {
          category: cat,
          amount,
          percentage,
          color: filter.categoryColorMap[cat] || '#71717A',
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const chartSlices: PieChartSlice[] = sortedCategories.map((item) => ({
      category: item.category,
      amount: item.amount,
      color: item.color,
      percentage: item.percentage,
    }));

    return {
      items: sortedCategories,
      totalSpend,
      chartSlices,
    };
  }, [localTransactions, filter.filterStartDate, filter.filterEndDate, filter.disabledCategories, filter.categoryColorMap]);

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Category-wise spending breakdown
        </Text>
      </View>

      {/* Prominent Date Range Badge */}
      <DateContextCard
        label={filter.displayRangeLabel}
        value={filter.displayRangeValue}
        colors={colors}
      />

      {/* Chart Card */}
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
        <View style={styles.chartWrapper}>
          <PieChart
            data={categoryStats.chartSlices}
            size={220}
            currencySymbol={currencySymbol}
            totalAmount={categoryStats.totalSpend}
            textColor={colors.text}
            textSecondaryColor={colors.textSecondary}
          />
        </View>
      </View>

      {/* Category Magnitude Breakdown List */}
      <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Breakdown</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {categoryStats.items.length} {categoryStats.items.length === 1 ? 'category' : 'categories'}
          </Text>
        </View>

        {categoryStats.items.length === 0 ? (
          <View style={styles.emptyListContainer}>
            <Text style={[styles.emptyListText, { color: colors.textSecondary }]}>
              No expense transactions for the selected filters.
            </Text>
          </View>
        ) : (
          <View style={styles.breakdownList}>
            {categoryStats.items.map((item, idx) => {
              const magnitudeRatio = categoryStats.totalSpend > 0 ? (item.amount / categoryStats.totalSpend) * 100 : 0;
              const barWidthPercentage = `${Math.max(magnitudeRatio, 2)}%`;

              return (
                <View key={`breakdown-${item.category}-${idx}`} style={styles.breakdownItem}>
                  <View style={styles.itemRow}>
                    <View style={styles.categoryNameContainer}>
                      <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                      <Text
                        style={[styles.categoryNameText, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {item.category}
                      </Text>
                    </View>
                    <View style={styles.amountContainer}>
                      <Text style={[styles.amountText, { color: colors.text }]}>
                        {currencySymbol}{formatIndianNumber(item.amount)}
                      </Text>
                      <Text style={[styles.percentageText, { color: colors.textSecondary }]}>
                        {item.percentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.barBackground, { backgroundColor: colors.backgroundSelected }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: item.color,
                          width: barWidthPercentage as any,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
  card: {
    borderRadius: 4,
    borderWidth: 1,
    padding: Spacing.three,
  },
  chartWrapper: {
    paddingVertical: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fontTitle,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: fontLight,
  },
  breakdownList: {
    gap: Spacing.three,
  },
  breakdownItem: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  colorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryNameText: {
    fontSize: 13,
    fontFamily: fontTitle,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  amountText: {
    fontSize: 13,
    fontFamily: fontNumber,
  },
  percentageText: {
    fontSize: 11,
    fontFamily: fontLight,
    minWidth: 38,
    textAlign: 'right',
  },
  barBackground: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyListContainer: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 13,
    fontFamily: fontLight,
    textAlign: 'center',
  },
});
