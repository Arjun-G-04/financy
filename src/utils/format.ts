// Indian number formatting with commas (e.g. 1,50,000.00)
export const formatIndianNumber = (amount: number): string => {
  const abs = Math.abs(amount);
  const [intPart, decPart = '00'] = abs.toFixed(2).split('.');
  let lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return `${formattedInt}.${decPart}`;
};

// Compact number formatting (e.g. 1.5k, 2.3L, 1.2Cr)
export const formatCompactNumber = (amount: number): string => {
  const abs = Math.abs(amount);
  if (abs >= 10000000) {
    return `${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (abs >= 100000) {
    return `${(amount / 100000).toFixed(1)}L`;
  }
  if (abs >= 1000) {
    return `${(amount / 1000).toFixed(1)}k`;
  }
  return amount.toFixed(0);
};

// Format Date object to YYYY-MM-DD
export const formatDateToYMD = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Format YYYY-MM-DD to human readable string (e.g. 1 Aug 2026)
export const formatDisplayDate = (ymdStr: string): string => {
  const parts = ymdStr.split('-');
  if (parts.length !== 3) return ymdStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const dateObj = new Date(y, m, d);
  return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Format timestamp to hh:mm AM/PM
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
