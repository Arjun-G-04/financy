import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { Spacing } from '@/constants/theme';
import { getCategoryColor } from '@/utils/category';

const fontTitle = 'Outfit-Bold';
const fontLight = 'Outfit-Regular';
const fontNumber = 'SpaceMono-Bold';

interface CategoryFilterModalProps {
  visible: boolean;
  onClose: () => void;
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  colors: any;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

export function CategoryFilterModal({
  visible,
  onClose,
  categories,
  selectedCategory,
  onSelectCategory,
  colors,
  categoryCounts,
  totalCount,
}: CategoryFilterModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    return categories.filter((c) =>
      c.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [categories, searchQuery]);

  const handleSelect = (cat: string | null) => {
    onSelectCategory(cat);
    onClose();
    setSearchQuery('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.modalCard, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3 6h18M6 12h12m-9 6h6"
                  stroke={colors.text}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Ledger by Category</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6l12 12"
                  stroke={colors.textSecondary}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Search bar if categories > 6 */}
          {categories.length > 6 && (
            <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  stroke={colors.textSecondary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search categories..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Categories List */}
          <ScrollView
            style={styles.categoryScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Option: All Categories */}
            <TouchableOpacity
              style={[
                styles.categoryOption,
                {
                  backgroundColor: selectedCategory === null ? colors.backgroundSelected : 'transparent',
                  borderColor: selectedCategory === null ? colors.emerald : 'transparent',
                },
              ]}
              onPress={() => handleSelect(null)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.allDot, { borderColor: colors.textSecondary }]} />
                <Text style={[styles.optionName, { color: colors.text, fontFamily: selectedCategory === null ? fontTitle : fontLight }]}>
                  All Categories
                </Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={[styles.countBadge, { color: colors.textSecondary }]}>
                  {totalCount}
                </Text>
                {selectedCategory === null && (
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17l-5-5" stroke={colors.emerald} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </Svg>
                )}
              </View>
            </TouchableOpacity>

            {/* List of categories */}
            {filteredCategories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const catColor = getCategoryColor(cat);
              const count = categoryCounts[cat] || 0;

              return (
                <TouchableOpacity
                  key={`cat-filter-${cat}`}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor: isSelected ? colors.backgroundSelected : 'transparent',
                      borderColor: isSelected ? catColor : 'transparent',
                    },
                  ]}
                  onPress={() => handleSelect(cat)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionLeft}>
                    <View style={[styles.catDot, { backgroundColor: catColor }]} />
                    <Text
                      style={[
                        styles.optionName,
                        {
                          color: colors.text,
                          fontFamily: isSelected ? fontTitle : fontLight,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {cat}
                    </Text>
                  </View>
                  <View style={styles.optionRight}>
                    <Text style={[styles.countBadge, { color: colors.textSecondary }]}>
                      {count}
                    </Text>
                    {isSelected && (
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <Path d="M20 6L9 17l-5-5" stroke={catColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </Svg>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {filteredCategories.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No matching category found.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '75%',
    borderRadius: 4,
    borderWidth: 1,
    padding: Spacing.three,
    zIndex: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: fontTitle,
    letterSpacing: -0.3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
    marginBottom: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontLight,
    paddingVertical: 0,
  },
  categoryScroll: {
    maxHeight: 320,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 4,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  allDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  optionName: {
    fontSize: 13,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    fontSize: 11,
    fontFamily: fontNumber,
  },
  emptyContainer: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontFamily: fontLight,
  },
});
