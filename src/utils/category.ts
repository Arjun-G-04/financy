// Generate stable category color based on name hash
export const getCategoryColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorsList = [
    '#38BDF8', // sky
    '#34D399', // emerald
    '#FB7185', // rose
    '#FBBF24', // amber
    '#C084FC', // purple
    '#F472B6', // pink
    '#FB923C', // orange
    '#2DD4BF', // teal
  ];
  const index = Math.abs(hash) % colorsList.length;
  return colorsList[index];
};
