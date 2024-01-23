export const categoryOptions = [
  { value: "0", label: "Crypto" },
  { value: "1", label: "Politics & Economics" },
  { value: "2", label: "Art & Culture" },
  { value: "3", label: "Literature & Media" },
  { value: "4", label: "Music" },
  { value: "5", label: "Movies & Series" },
  { value: "6", label: "Lifestyle & Technology" },
  { value: "7", label: "Sports & Games" },
  { value: "8", label: "World & Nature" },
  { value: "9", label: "Science" },
  { value: "10", label: "Miscellaneous" },
];

export const decayOptions = [
  { value: "11.111", label: "Minutes" }, // ln(e) / (1 hour in slots) * 100000
  { value: "1.065", label: "Hours" }, // ln(10) / (1 day in slots) * 100000
  { value: "0.304", label: "Days" }, // ln(100) / (1 week in slots) * 100000
  { value: "0.1065", label: "Weeks" }, // ln(1000) / (30 days in slots) * 100000
  { value: "0.01167", label: "Months" }, // ln(10000) / (1 year in slots) * 100000
  { value: "0.0029173", label: "Years" }, // ln(100000) / (5 years in slots) * 100000
];
