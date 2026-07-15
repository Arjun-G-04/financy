import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  useColorScheme,
  Modal,
} from 'react-native';
import { SheetTransaction } from '@/services/googleSheets';
import { Colors, Spacing } from '@/constants/theme';
import Toast from 'react-native-toast-message';
import { DatabaseService, Category } from '@/services/database';

interface ImportTransactionModalProps {
  transaction: SheetTransaction | null;
  onClose: () => void;
  onConfirm: (name: string, category: string | null) => void;
  currencySymbol: string;
}

const fontTitle = 'Outfit-Bold';
const fontText = 'Outfit-Regular';
const fontLight = 'Outfit-Regular';
const fontNumber = 'SpaceMono-Bold';

import { getCategoryColor } from '@/utils/category';

export function ImportTransactionModal({
  transaction,
  onClose,
  onConfirm,
  currencySymbol,
}: ImportTransactionModalProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'dark' : scheme];
  
  const [importNameInput, setImportNameInput] = useState('');
  const [importCategory, setImportCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    try {
      const cats = DatabaseService.getCategories();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategories(cats);
    } catch (e) {
      console.error('Failed to load categories in ImportTransactionModal:', e);
    }
  }, []);

  const handleConfirmImport = () => {
    if (!importNameInput.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Input Missing',
        text2: 'Please enter a name for this transaction',
      });
      return;
    }
    onConfirm(importNameInput.trim(), importCategory);
  };

  if (!transaction) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={transaction !== null}
      onRequestClose={onClose}
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
          <View style={[styles.importDialogContent, { backgroundColor: colors.backgroundElement }]}>
            
            <View style={styles.importHeaderBlock}>
              <Text style={[styles.importDialogTitle, { color: colors.text }]}>Import to Ledger</Text>
              <Text style={[styles.importDialogSubtitle, { color: colors.textSecondary }]}>
                Specify a local name based on memory or clue
              </Text>
            </View>
            
            <View style={styles.tilesContainer}>
              {/* Row for Date, Type, Amount */}
              <View style={styles.tilesRow}>
                
                {/* Date Tile */}
                <View style={[styles.tileCard, { flex: 1.4, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
                  <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>DATE</Text>
                  <Text style={[styles.tileValue, { color: colors.text }]} numberOfLines={1}>
                    {transaction.date}
                  </Text>
                </View>

                {/* Type Tile */}
                <View style={[styles.tileCard, { flex: 0.6, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
                  <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>TYPE</Text>
                  <Text style={[styles.tileValue, { color: transaction.type === 'credit' ? colors.emerald : colors.rose }]} numberOfLines={1}>
                    {transaction.type === 'credit' ? 'C' : 'D'}
                  </Text>
                </View>

                {/* Amount Tile */}
                <View style={[styles.tileCard, { flex: 1.0, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
                  <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>AMOUNT</Text>
                  <Text style={[styles.tileValue, { color: colors.text }]} numberOfLines={1}>
                    {currencySymbol}{transaction.amount.toFixed(2)}
                  </Text>
                </View>

              </View>

              {/* Full width Merchant Clue Tile */}
              <View style={[styles.tileCardFull, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
                <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>MERCHANT INFO CLUE</Text>
                <Text style={[styles.tileValueLarge, { color: colors.text }]} numberOfLines={2}>
                  {transaction.merchant}
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Ledger Transaction Name</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    borderColor: colors.backgroundSelected,
                    backgroundColor: colors.background,
                  }
                ]}
                placeholder="Enter custom description"
                placeholderTextColor={colors.textSecondary}
                value={importNameInput}
                onChangeText={setImportNameInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category</Text>
              {categories.length === 0 ? (
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontStyle: 'italic', fontFamily: fontLight }}>
                  No categories available. Add them in Settings.
                </Text>
              ) : (
                <View style={styles.categoryChipsContainer}>
                  {categories.map(cat => {
                    const isSelected = importCategory === cat.name;
                    const catColor = getCategoryColor(cat.name);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          { backgroundColor: colors.background },
                          isSelected && { backgroundColor: catColor + '15' }
                        ]}
                        onPress={() => setImportCategory(isSelected ? null : cat.name)}
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

            <View style={styles.importActionsBlock}>
              <TouchableOpacity
                style={[styles.importActBtn, styles.importCancelBtn, { borderColor: colors.backgroundSelected }]}
                onPress={onClose}
              >
                <Text style={[styles.importActBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.importActBtn, styles.importConfirmBtn, { backgroundColor: colors.text }]}
                onPress={handleConfirmImport}
              >
                <Text style={[styles.importActBtnText, { color: colors.background }]}>Confirm Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlayBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  importDialogContent: {
    width: '90%',
    maxWidth: 450,
    borderRadius: 4,
    padding: Spacing.three,
    gap: Spacing.two,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    alignSelf: 'center',
  },
  importHeaderBlock: {
    marginTop: Spacing.two,
    gap: 4,
  },
  importDialogTitle: {
    fontFamily: fontTitle,
    fontSize: 18,
    letterSpacing: -0.4,
    marginBottom: Spacing.one,
  },
  importDialogSubtitle: {
    fontFamily: fontLight,
    fontSize: 12,
  },
  tilesContainer: {
    gap: Spacing.two,
    width: '100%',
    marginTop: Spacing.one,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    width: '100%',
  },
  tileCard: {
    flex: 1,
    borderRadius: 4,
    borderWidth: 1,
    padding: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  tileCardFull: {
    width: '100%',
    borderRadius: 4,
    borderWidth: 1,
    padding: Spacing.three,
    minHeight: 70,
  },
  tileLabel: {
    fontFamily: fontTitle,
    fontSize: 9,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  tileValue: {
    fontFamily: fontNumber,
    fontSize: 13,
  },
  tileValueLarge: {
    fontFamily: fontTitle,
    fontSize: 16,
    lineHeight: 22,
  },
  inputGroup: {
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
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    fontSize: 14,
  },
  importActionsBlock: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
    width: '100%',
  },
  importActBtn: {
    flex: 1,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importCancelBtn: {
    borderWidth: 1,
  },
  importConfirmBtn: {},
  importActBtnText: {
    fontFamily: fontTitle,
    fontSize: 14,
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
});
