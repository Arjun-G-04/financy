import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { Spacing } from '@/constants/theme';
import { CustomDatePicker } from './CustomDatePicker';
import { DateRangePreset } from '@/hooks/useAnalyticsFilter';

const fontTitle = 'Outfit-Bold';
const fontLight = 'Outfit-Regular';
const fontNumber = 'SpaceMono-Bold';

interface AnalyticsFilterPanelProps {
  colors: any;
  scheme: string;
  isFilterPanelExpanded: boolean;
  setIsFilterPanelExpanded: (expanded: boolean | ((prev: boolean) => boolean)) => void;
  datePreset: DateRangePreset;
  setDatePreset: (preset: DateRangePreset) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  activeDatePicker: 'start' | 'end' | null;
  setActiveDatePicker: (target: 'start' | 'end' | null) => void;
  allAvailableCategories: string[];
  disabledCategories: Set<string>;
  categoryColorMap: Record<string, string>;
  handleToggleCategory: (category: string) => void;
  handleSelectAllCategories: () => void;
  handleDeselectAllCategories: () => void;
}

export function AnalyticsFilterPanel({
  colors,
  scheme,
  isFilterPanelExpanded,
  setIsFilterPanelExpanded,
  datePreset,
  setDatePreset,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  activeDatePicker,
  setActiveDatePicker,
  allAvailableCategories,
  disabledCategories,
  categoryColorMap,
  handleToggleCategory,
  handleSelectAllCategories,
  handleDeselectAllCategories,
}: AnalyticsFilterPanelProps) {
  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={() => setIsFilterPanelExpanded((prev: boolean) => !prev)}
        activeOpacity={0.7}
      >
        <View style={styles.panelTitleRow}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 6h18M6 12h12m-9 6h6"
              stroke={colors.text}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={[styles.panelTitle, { color: colors.text }]}>Filter & Edit Options</Text>
        </View>
        <Svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          style={{ transform: [{ rotate: isFilterPanelExpanded ? '180deg' : '0deg' }] }}
        >
          <Path
            d="M6 9l6 6 6-6"
            stroke={colors.textSecondary}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>

      {isFilterPanelExpanded && (
        <View style={styles.panelContent}>
          {/* Date Range Section */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterGroupTitle, { color: colors.textSecondary }]}>
              DATE RANGE
            </Text>
            <View style={styles.chipRow}>
              {(
                [
                  { key: 'this_month', label: 'This Month' },
                  { key: 'last_month', label: 'Last Month' },
                  { key: '30_days', label: '30 Days' },
                  { key: 'all', label: 'All Time' },
                  { key: 'custom', label: 'Custom' },
                ] as const
              ).map((preset) => {
                const isSelected = datePreset === preset.key;
                return (
                  <TouchableOpacity
                    key={`preset-${preset.key}`}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected ? colors.text : colors.backgroundSelected,
                      },
                    ]}
                    onPress={() => setDatePreset(preset.key)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: isSelected ? colors.background : colors.text },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Date Pickers */}
            {datePreset === 'custom' && (
              <View style={styles.customDateRow}>
                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    { backgroundColor: colors.background, borderColor: colors.backgroundSelected },
                  ]}
                  onPress={() => setActiveDatePicker('start')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dateButtonLabel, { color: colors.textSecondary }]}>From</Text>
                  <Text style={[styles.dateButtonValue, { color: colors.text }]}>
                    {customStartDate}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    { backgroundColor: colors.background, borderColor: colors.backgroundSelected },
                  ]}
                  onPress={() => setActiveDatePicker('end')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dateButtonLabel, { color: colors.textSecondary }]}>To</Text>
                  <Text style={[styles.dateButtonValue, { color: colors.text }]}>
                    {customEndDate}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Category Toggle Section */}
          <View style={styles.filterSection}>
            <View style={styles.categoryToggleHeader}>
              <Text style={[styles.filterGroupTitle, { color: colors.textSecondary }]}>
                CATEGORIES ({allAvailableCategories.length - disabledCategories.size}/{allAvailableCategories.length})
              </Text>
              <View style={styles.quickActionsRow}>
                <TouchableOpacity onPress={handleSelectAllCategories} activeOpacity={0.7}>
                  <Text style={[styles.quickActionText, { color: colors.emerald }]}>Select All</Text>
                </TouchableOpacity>
                <Text style={{ color: colors.textSecondary }}>•</Text>
                <TouchableOpacity onPress={handleDeselectAllCategories} activeOpacity={0.7}>
                  <Text style={[styles.quickActionText, { color: colors.rose }]}>Deselect All</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.categoryChipsContainer}>
              {allAvailableCategories.map((category) => {
                const isSelected = !disabledCategories.has(category);
                const catColor = categoryColorMap[category] || '#71717A';

                return (
                  <TouchableOpacity
                    key={`toggle-panel-${category}`}
                    style={[
                      styles.categoryToggleChip,
                      {
                        backgroundColor: isSelected
                          ? scheme === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.05)'
                          : colors.backgroundSelected,
                        borderColor: isSelected ? catColor : 'transparent',
                        opacity: isSelected ? 1.0 : 0.45,
                      },
                    ]}
                    onPress={() => handleToggleCategory(category)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.categoryToggleDot,
                        { backgroundColor: isSelected ? catColor : colors.textSecondary },
                      ]}
                    />
                    <Text
                      style={[
                        styles.categoryToggleText,
                        {
                          color: isSelected ? colors.text : colors.textSecondary,
                          fontFamily: isSelected ? fontTitle : fontLight,
                        },
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Date Pickers */}
      <CustomDatePicker
        visible={activeDatePicker === 'start'}
        value={customStartDate}
        onClose={() => setActiveDatePicker(null)}
        onSelect={(date) => setCustomStartDate(date)}
      />
      <CustomDatePicker
        visible={activeDatePicker === 'end'}
        value={customEndDate}
        onClose={() => setActiveDatePicker(null)}
        onSelect={(date) => setCustomEndDate(date)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 4,
    borderWidth: 1,
    padding: Spacing.three,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panelTitle: {
    fontSize: 14,
    fontFamily: fontTitle,
  },
  panelContent: {
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: Spacing.four,
  },
  filterSection: {
    gap: Spacing.two,
  },
  filterGroupTitle: {
    fontSize: 10,
    fontFamily: fontLight,
    letterSpacing: 0.8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  filterChipText: {
    fontSize: 11,
    fontFamily: fontTitle,
  },
  customDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  datePickerButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  dateButtonLabel: {
    fontSize: 9,
    fontFamily: fontLight,
    textTransform: 'uppercase',
  },
  dateButtonValue: {
    fontSize: 12,
    fontFamily: fontNumber,
    marginTop: 2,
  },
  categoryToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickActionText: {
    fontSize: 11,
    fontFamily: fontTitle,
  },
  categoryChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryToggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  categoryToggleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryToggleText: {
    fontSize: 11,
  },
});
