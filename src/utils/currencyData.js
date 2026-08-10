export const WORLD_CURRENCIES = [
  { country: "India", code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" },
  { country: "United States", code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { country: "United Kingdom", code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  { country: "European Union", code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { country: "Japan", code: "JPY", symbol: "¥", name: "Japanese Yen", flag: "🇯🇵" },
  { country: "Canada", code: "CAD", symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦" },
  { country: "Australia", code: "AUD", symbol: "A$", name: "Australian Dollar", flag: "🇦🇺" },
  { country: "UAE", code: "AED", symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪" },
  { country: "Singapore", code: "SGD", symbol: "S$", name: "Singapore Dollar", flag: "🇸🇬" },
  { country: "Switzerland", code: "CHF", symbol: "CHF", name: "Swiss Franc", flag: "🇨🇭" },
  { country: "China", code: "CNY", symbol: "¥", name: "Chinese Yuan", flag: "🇨🇳" },
  { country: "Brazil", code: "BRL", symbol: "R$", name: "Brazilian Real", flag: "🇧🇷" },
  { country: "Mexico", code: "MXN", symbol: "$", name: "Mexican Peso", flag: "🇲🇽" },
  { country: "South Africa", code: "ZAR", symbol: "R", name: "South African Rand", flag: "🇿🇦" },
  { country: "Saudi Arabia", code: "SAR", symbol: "﷼", name: "Saudi Riyal", flag: "🇸🇦" },
  { country: "South Korea", code: "KRW", symbol: "₩", name: "South Korean Won", flag: "🇰🇷" },
  { country: "New Zealand", code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", flag: "🇳🇿" },
  { country: "Sweden", code: "SEK", symbol: "kr", name: "Swedish Krona", flag: "🇸🇪" },
  { country: "Norway", code: "NOK", symbol: "kr", name: "Norwegian Krone", flag: "🇳🇴" },
  { country: "Denmark", code: "DKK", symbol: "kr", name: "Danish Krone", flag: "🇩🇰" },
  { country: "Poland", code: "PLN", symbol: "zł", name: "Polish Zloty", flag: "🇵🇱" },
  { country: "Thailand", code: "THB", symbol: "฿", name: "Thai Baht", flag: "🇹🇭" },
  { country: "Indonesia", code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", flag: "🇮🇩" },
  { country: "Malaysia", code: "MYR", symbol: "RM", name: "Malaysian Ringgit", flag: "🇲🇾" },
  { country: "Philippines", code: "PHP", symbol: "₱", name: "Philippine Peso", flag: "🇵🇭" },
  { country: "Vietnam", code: "VND", symbol: "₫", name: "Vietnamese Dong", flag: "🇻🇳" },
  { country: "Egypt", code: "EGP", symbol: "E£", name: "Egyptian Pound", flag: "🇪🇬" },
  { country: "Nigeria", code: "NGN", symbol: "₦", name: "Nigerian Naira", flag: "🇳🇬" },
  { country: "Kenya", code: "KES", symbol: "KSh", name: "Kenyan Shilling", flag: "🇰🇪" },
  { country: "Argentina", code: "ARS", symbol: "$", name: "Argentine Peso", flag: "🇦🇷" },
  { country: "Chile", code: "CLP", symbol: "$", name: "Chilean Peso", flag: "🇨🇱" },
  { country: "Israel", code: "ILS", symbol: "₪", name: "Israeli New Shekel", flag: "🇮🇱" },
  { country: "Turkey", code: "TRY", symbol: "₺", name: "Turkish Lira", flag: "🇹🇷" },
  { country: "Pakistan", code: "PKR", symbol: "Rs", name: "Pakistani Rupee", flag: "🇵🇰" },
  { country: "Bangladesh", code: "BDT", symbol: "৳", name: "Bangladeshi Taka", flag: "🇧🇩" },
  { country: "Sri Lanka", code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee", flag: "🇱🇰" },
  { country: "Nepal", code: "NPR", symbol: "Rs", name: "Nepalese Rupee", flag: "🇳🇵" },
  { country: "Qatar", code: "QAR", symbol: "ر.ق", name: "Qatari Riyal", flag: "🇶🇦" },
  { country: "Oman", code: "OMR", symbol: "ر.ع.", name: "Omani Rial", flag: "🇴🇲" },
  { country: "Kuwait", code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar", flag: "🇰🇼" },
  { country: "Bahrain", code: "BHD", symbol: ".د.b", name: "Bahraini Dinar", flag: "🇧🇭" }
];

export function getCurrencyByCode(code) {
  return WORLD_CURRENCIES.find(c => c.code.toUpperCase() === code.toUpperCase()) || WORLD_CURRENCIES[1]; // default USD
}

export function searchCurrencies(query) {
  if (!query || !query.trim()) return WORLD_CURRENCIES;
  const q = query.toLowerCase().trim();
  return WORLD_CURRENCIES.filter(
    item =>
      item.country.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.symbol.toLowerCase().includes(q)
  );
}
