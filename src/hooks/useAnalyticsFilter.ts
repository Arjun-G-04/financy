import { useState, useMemo } from 'react';
import { LocalTransaction } from '@/services/database';
import { formatDateToYMD, formatDisplayDate } from '@/utils/format';
import { isIncomeCategory, getCategoryColorsMap } from '@/utils/category';

export type DateRangePreset = 'this_month' | 'last_month' | '30_days' | 'all' | 'custom';

export function useAnalyticsFilter(localTransactions: LocalTransaction[]) {
  const [datePreset, setDatePreset] = useState<DateRangePreset>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return formatDateToYMD(d);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return formatDateToYMD(new Date());
  });

  const [activeDatePicker, setActiveDatePicker] = useState<'start' | 'end' | null>(null);
  const [disabledCategories, setDisabledCategories] = useState<Set<string>>(new Set());
  const [isFilterPanelExpanded, setIsFilterPanelExpanded] = useState<boolean>(true);

  // 1. Collect all non-income categories present in transactions (or 'Uncategorized')
  const allAvailableCategories = useMemo(() => {
    const catSet = new Set<string>();
    for (const tx of localTransactions) {
      const cat = tx.category?.trim() || 'Uncategorized';
      if (!isIncomeCategory(cat)) {
        catSet.add(cat);
      }
    }
    return Array.from(catSet).sort();
  }, [localTransactions]);

  // Unique color mapping for all available categories
  const categoryColorMap = useMemo(() => {
    return getCategoryColorsMap(allAvailableCategories);
  }, [allAvailableCategories]);

  // 2. Compute date range bounds
  const { filterStartDate, filterEndDate, displayRangeLabel, displayRangeValue } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (datePreset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const startStr = formatDateToYMD(firstDay);
      const endStr = formatDateToYMD(lastDay);
      return {
        filterStartDate: startStr,
        filterEndDate: endStr,
        displayRangeLabel: 'THIS MONTH',
        displayRangeValue: `${formatDisplayDate(startStr)} – ${formatDisplayDate(endStr)}`,
      };
    }

    if (datePreset === 'last_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      const startStr = formatDateToYMD(firstDay);
      const endStr = formatDateToYMD(lastDay);
      return {
        filterStartDate: startStr,
        filterEndDate: endStr,
        displayRangeLabel: 'LAST MONTH',
        displayRangeValue: `${formatDisplayDate(startStr)} – ${formatDisplayDate(endStr)}`,
      };
    }

    if (datePreset === '30_days') {
      const past30 = new Date(today);
      past30.setDate(today.getDate() - 30);
      const startStr = formatDateToYMD(past30);
      const endStr = formatDateToYMD(today);
      return {
        filterStartDate: startStr,
        filterEndDate: endStr,
        displayRangeLabel: 'LAST 30 DAYS',
        displayRangeValue: `${formatDisplayDate(startStr)} – ${formatDisplayDate(endStr)}`,
      };
    }

    if (datePreset === 'custom') {
      return {
        filterStartDate: customStartDate,
        filterEndDate: customEndDate,
        displayRangeLabel: 'CUSTOM RANGE',
        displayRangeValue: `${formatDisplayDate(customStartDate)} – ${formatDisplayDate(customEndDate)}`,
      };
    }

    // 'all' preset: calculate from earliest transaction to latest transaction
    let minDate = '';
    let maxDate = '';
    for (const tx of localTransactions) {
      if (!minDate || tx.date < minDate) minDate = tx.date;
      if (!maxDate || tx.date > maxDate) maxDate = tx.date;
    }
    return {
      filterStartDate: minDate || null,
      filterEndDate: maxDate || null,
      displayRangeLabel: 'ALL TIME',
      displayRangeValue: minDate && maxDate ? `${formatDisplayDate(minDate)} – ${formatDisplayDate(maxDate)}` : 'Entire Ledger History',
    };
  }, [datePreset, customStartDate, customEndDate, localTransactions]);

  const handleToggleCategory = (category: string) => {
    setDisabledCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleSelectAllCategories = () => {
    setDisabledCategories(new Set());
  };

  const handleDeselectAllCategories = () => {
    setDisabledCategories(new Set(allAvailableCategories));
  };

  return {
    datePreset,
    setDatePreset,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    activeDatePicker,
    setActiveDatePicker,
    disabledCategories,
    setDisabledCategories,
    isFilterPanelExpanded,
    setIsFilterPanelExpanded,
    allAvailableCategories,
    categoryColorMap,
    filterStartDate,
    filterEndDate,
    displayRangeLabel,
    displayRangeValue,
    handleToggleCategory,
    handleSelectAllCategories,
    handleDeselectAllCategories,
  };
}
