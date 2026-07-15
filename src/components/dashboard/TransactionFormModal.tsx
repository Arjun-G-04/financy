import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { Category } from '@/services/database';
import { Spacing } from '@/constants/theme';
import { CustomDatePicker } from './CustomDatePicker';

const fontTitle = 'Outfit-Bold';
const fontText = 'Outfit-Regular';
const fontLight = 'Outfit-Regular';
const fontNumber = 'SpaceMono-Bold';
const fontNumberRegular = 'SpaceMono-Regular';

import { getCategoryColor } from '@/utils/category';

interface TransactionFormModalProps {
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  editingTxId: string | null;
  handleCancelEdit: () => void;
  colors: any;
  currencySymbol: string;
  manualDate: string;
  setManualDate: (date: string) => void;
  manualType: 'credit' | 'debit';
  setManualType: (type: 'credit' | 'debit') => void;
  manualAmount: string;
  setManualAmount: (amount: string) => void;
  manualName: string;
  setManualName: (name: string) => void;
  manualCategory: string | null;
  setManualCategory: (cat: string | null) => void;
  categories: Category[];
  handleSaveManualEntry: () => void;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
}

export function TransactionFormModal({
  showForm,
  setShowForm,
  editingTxId,
  handleCancelEdit,
  colors,
  currencySymbol,
  manualDate,
  setManualDate,
  manualType,
  setManualType,
  manualAmount,
  setManualAmount,
  manualName,
  setManualName,
  manualCategory,
  setManualCategory,
  categories,
  handleSaveManualEntry,
  showDatePicker,
  setShowDatePicker,
}: TransactionFormModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showForm}
      onRequestClose={editingTxId ? handleCancelEdit : () => setShowForm(false)}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.modalOverlayBg}
      >
        <ScrollView
          contentContainerStyle={styles.modalScrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formContainer, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {editingTxId ? 'Edit Transaction' : 'Add Transaction'}
            </Text>
            
            <View style={styles.formRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Date</Text>
                <TouchableOpacity
                  style={[styles.datePickerTrigger, { backgroundColor: colors.background }]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.datePickerText, { color: manualDate ? colors.text : colors.textSecondary }]}>
                    {manualDate || 'Select Date'}
                  </Text>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path d="M8 7V3M16 7V3M3 11H21M5 5H19C20.1046 5 21 5.89543 21 7V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7C3 5.89543 3.89543 5 5 5Z" stroke={colors.textSecondary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </Svg>
                </TouchableOpacity>
              </View>

              <View style={{ width: Spacing.two }} />

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Type</Text>
                <View style={[styles.typeToggleContainer, { backgroundColor: colors.background }]}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton, 
                      manualType === 'debit' && { backgroundColor: 'rgba(244, 63, 94, 0.12)' }
                    ]}
                    onPress={() => setManualType('debit')}
                  >
                    <Text style={[styles.typeButtonText, { color: manualType === 'debit' ? colors.rose : colors.textSecondary }]}>Debit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton, 
                      manualType === 'credit' && { backgroundColor: 'rgba(52, 211, 153, 0.12)' }
                    ]}
                    onPress={() => setManualType('credit')}
                  >
                    <Text style={[styles.typeButtonText, { color: manualType === 'credit' ? colors.emerald : colors.textSecondary }]}>Credit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount ({currencySymbol})</Text>
              <TextInput
                style={[styles.textInput, { fontFamily: fontNumber, color: colors.text, backgroundColor: colors.background }]}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                value={manualAmount}
                onChangeText={setManualAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Transaction Name</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text, backgroundColor: colors.background }]}
                placeholder="e.g. Weekly Groceries"
                placeholderTextColor={colors.textSecondary}
                value={manualName}
                onChangeText={setManualName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category</Text>
              {categories.length === 0 ? (
                <Text style={styles.noCategoriesText}>
                  No categories available. Add them in Settings.
                </Text>
              ) : (
                <View style={styles.categoryChipsContainer}>
                  {categories.map(cat => {
                    const isSelected = manualCategory === cat.name;
                    const catColor = getCategoryColor(cat.name);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          { backgroundColor: colors.background },
                          isSelected && { backgroundColor: catColor + '15' }
                        ]}
                        onPress={() => setManualCategory(isSelected ? null : cat.name)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.chipDot, { backgroundColor: catColor }]} />
                        <Text
                          style={[
                            styles.categoryChipText,
                            { color: isSelected ? catColor : colors.text }
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1 }]}
                onPress={editingTxId ? handleCancelEdit : () => setShowForm(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.text, flex: 1 }]}
                onPress={handleSaveManualEntry}
                activeOpacity={0.8}
              >
                <Text style={[styles.primaryButtonText, { color: colors.background }]}>
                  {editingTxId ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomDatePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={manualDate}
        onSelect={setManualDate}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlayBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
  formContainer: {
    borderRadius: 4,
    padding: Spacing.three,
    gap: Spacing.two,
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontFamily: fontTitle,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: Spacing.one,
  },
  formRow: {
    flexDirection: 'row',
    width: '100%',
  },
  inputGroup: {
    flexDirection: 'column',
    gap: Spacing.one,
  },
  inputLabel: {
    fontFamily: fontTitle,
    fontSize: 12,
    letterSpacing: -0.1,
  },
  textInput: {
    fontFamily: fontText,
    height: 40,
    borderRadius: 4,
    paddingHorizontal: Spacing.two,
    fontSize: 14,
  },
  datePickerTrigger: {
    height: 40,
    borderRadius: 4,
    paddingHorizontal: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: {
    fontFamily: fontNumberRegular,
    fontSize: 14,
  },
  noCategoriesText: {
    fontFamily: fontLight,
    color: '#71717A',
    fontSize: 13,
    fontStyle: 'italic',
  },
  typeToggleContainer: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 4,
    padding: 2,
    gap: 4,
  },
  typeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  typeButtonText: {
    fontFamily: fontTitle,
    fontSize: 13,
  },
  categoryChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    height: 30,
    borderRadius: 4,
    marginRight: 2,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  categoryChipText: {
    fontFamily: fontTitle,
    fontSize: 12,
  },
  primaryButton: {
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: fontTitle,
    fontSize: 14,
  },
  secondaryButton: {
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: fontTitle,
    fontSize: 14,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
    width: '100%',
  },
});
