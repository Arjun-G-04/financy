import React from 'react';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';

interface CustomDatePickerProps {
  visible: boolean;
  onClose: () => void;
  value: string; // YYYY-MM-DD format
  onSelect: (dateStr: string) => void;
}

export function CustomDatePicker({ visible, onClose, value, onSelect }: CustomDatePickerProps) {
  if (!visible) return null;

  // Parse YYYY-MM-DD in local time safely
  const parts = value.split('-');
  const year = parts[0] ? parseInt(parts[0], 10) : new Date().getFullYear();
  const month = parts[1] ? parseInt(parts[1], 10) - 1 : new Date().getMonth();
  const day = parts[2] ? parseInt(parts[2], 10) : new Date().getDate();
  const dateValue = new Date(year, month, day);

  const handleValueChange = (event: DateTimePickerChangeEvent, selectedDate?: Date) => {
    onClose();
    if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      onSelect(`${y}-${m}-${d}`);
    }
  };

  const handleDismiss = () => {
    onClose();
  };

  return (
    <DateTimePicker
      value={dateValue}
      mode="date"
      display="default"
      onValueChange={handleValueChange}
      onDismiss={handleDismiss}
    />
  );
}
