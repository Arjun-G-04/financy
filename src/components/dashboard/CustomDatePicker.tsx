/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  useColorScheme,
} from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

interface CustomDatePickerProps {
  visible: boolean;
  onClose: () => void;
  value: string; // YYYY-MM-DD format
  onSelect: (dateStr: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function CustomDatePicker({ visible, onClose, value, onSelect }: CustomDatePickerProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'dark' : scheme];
  
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  useEffect(() => {
    if (value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = value.split('-');
      setCalYear(parseInt(parts[0]));
      setCalMonth(parseInt(parts[1]) - 1);
    }
  }, [value, visible]);

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(prev => prev - 1);
    } else {
      setCalMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(prev => prev + 1);
    } else {
      setCalMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(calMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const selectedDateStr = `${calYear}-${formattedMonth}-${formattedDay}`;
    onSelect(selectedDateStr);
    onClose();
  };

  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const totalDays = new Date(calYear, calMonth + 1, 0).getDate();

  const daysArray: { type: 'empty' | 'day'; value?: number; id: string }[] = [];

  // Week begins on Sunday (index 0)
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push({ type: 'empty', id: `empty-${i}` });
  }

  for (let i = 1; i <= totalDays; i++) {
    daysArray.push({ type: 'day', value: i, id: `day-${i}` });
  }

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlayBg}>
        <View style={[styles.calendarModalContent, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          {/* Calendar Header */}
          <View style={styles.calendarModalHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.calNavBtn}>
              <Text style={[styles.calNavText, { color: colors.text }]}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={[styles.calMonthLabel, { color: colors.text }]}>
              {MONTH_NAMES[calMonth]} {calYear}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.calNavBtn}>
              <Text style={[styles.calNavText, { color: colors.text }]}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          {/* Week Headers */}
          <View style={styles.weekdayRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <Text key={day} style={[styles.weekdayText, { color: colors.textSecondary }]}>
                {day}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.calendarGrid}>
            {daysArray.map((cell) => {
              if (cell.type === 'empty') {
                return <View key={cell.id} style={styles.calendarCellEmpty} />;
              }

              const dayVal = cell.value || 1;
              const formattedMonth = String(calMonth + 1).padStart(2, '0');
              const formattedDay = String(dayVal).padStart(2, '0');
              const cellDateStr = `${calYear}-${formattedMonth}-${formattedDay}`;
              const isSelected = value === cellDateStr;

              return (
                <TouchableOpacity
                  key={cell.id}
                  style={[
                    styles.calendarCellDay,
                    isSelected && { backgroundColor: colors.text }
                  ]}
                  onPress={() => handleSelectDay(dayVal)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.calendarCellDayText, { color: isSelected ? colors.background : colors.text }]}>
                    {dayVal}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.calCloseBtn, { backgroundColor: colors.backgroundSelected }]}
            onPress={onClose}
          >
            <Text style={[styles.calCloseBtnText, { color: colors.text }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlayBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModalContent: {
    width: '90%',
    maxWidth: 350,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: Spacing.four,
    alignItems: 'center',
    alignSelf: 'center',
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.three,
  },
  calNavBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calNavText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calMonthLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  weekdayRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  calendarCellEmpty: {
    width: '14.28%',
    height: 40,
  },
  calendarCellDay: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: Spacing.one,
  },
  calendarCellDayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calCloseBtn: {
    marginTop: Spacing.three,
    width: '100%',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
