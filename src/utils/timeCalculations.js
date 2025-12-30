export const calculateHourlyRate = (salary, daysPerWeek, hoursPerDay) => {
  if (!salary || !daysPerWeek || !hoursPerDay) return 0;
  // Approximation: 4 weeks per month
  const totalHours = daysPerWeek * hoursPerDay * 4;
  return salary / totalHours;
};

export const calculateTimeCost = (amount, hourlyRate) => {
  if (!amount || !hourlyRate || hourlyRate <= 0) return "0dk";

  const totalHoursDecimal = amount / hourlyRate;
  const hours = Math.floor(totalHoursDecimal);
  const minutes = Math.round((totalHoursDecimal - hours) * 60);

  if (hours === 0) {
    return `${minutes}dk`;
  }
  if (minutes === 0) {
    return `${hours}sa`;
  }
  return `${hours}sa ${minutes}dk`;
};

export const calculateDailyEarnings = (salary, daysPerWeek) => {
    if (!salary || !daysPerWeek) return 0;
    return salary / (daysPerWeek * 4);
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount || 0);
};

export const parseTurkishNumber = (str) => {
  if (!str) return 0;
  // Convert "30.000,50" to "30000.50"
  const clean = str.toString().replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  return parseFloat(clean) || 0;
};

export const formatTurkishNumber = (val) => {
  if (val === undefined || val === null || val === '') return '';
  
  // If number, format it properly to TR string first (151.51 -> "151,51")
  if (typeof val === 'number') {
      return val.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  }

  const str = val.toString();
  
  // 1. Identify parts. Always split by comma for decimals in TR locale.
  const parts = str.split(',');
  
  // 2. Clean integer part
  // Remove all dots (thousands separators) and non-digits
  let integerPart = parts[0].replace(/\./g, '');
  const isNegative = integerPart.startsWith('-');
  integerPart = integerPart.replace(/[^\d]/g, '');
  
  if (integerPart === '' && !isNegative) {
      // If user cleared everything but maybe left a comma? 
      // specific case: "," -> "0,"
      if (str.includes(',')) return '0,';
      return '';
  }

  let formattedInteger = '';
  if (integerPart !== '') {
      const integerVal = BigInt(integerPart); // Use BigInt for large salaries
      formattedInteger = new Intl.NumberFormat('tr-TR').format(integerVal);
      if (isNegative) formattedInteger = '-' + formattedInteger;
  } else if (isNegative) {
      formattedInteger = '-';
  }

  // 3. Handle decimal part
  if (parts.length > 1) {
    // Keep only digits, max 2
    const decimalPart = parts[1].replace(/[^\d]/g, '').slice(0, 2);
    return `${formattedInteger},${decimalPart}`;
  }
  
  // 4. Handle trailing comma check from original input
  if (str.endsWith(',')) {
    return `${formattedInteger},`;
  }

  return formattedInteger;
};
