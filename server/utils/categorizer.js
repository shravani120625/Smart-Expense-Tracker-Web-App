const RULES = [
  { keywords: ['uber', 'ola', 'cab', 'taxi', 'transport', 'train', 'metro', 'flight', 'bus'], category: 'Travel' },
  { keywords: ['zomato', 'swiggy', 'cafe', 'restaurant', 'starbucks', 'food', 'pizza', 'burger', 'mcdonald', 'groceries', 'supermarket', 'd mart'], category: 'Food' },
  { keywords: ['amazon', 'flipkart', 'myntra', 'shopping', 'clothing', 'shoes', 'mall'], category: 'Shopping' },
  { keywords: ['rent', 'landlord', 'room', 'hostel', 'pg'], category: 'Rent' },
  { keywords: ['electricity', 'water', 'gas', 'broadband', 'wifi', 'recharge', 'jio', 'airtel', 'netflix', 'spotify', 'prime', 'subscription', 'bill'], category: 'Bills' },
  { keywords: ['udemy', 'coursera', 'course', 'college', 'tuition', 'book', 'exam', 'training'], category: 'Education' },
  { keywords: ['salary', 'allowance', 'dividend', 'bonus', 'refund', 'interest', 'freelance'], category: 'Income' }
];

const suggestCategory = (description) => {
  if (!description) return 'Other';
  const desc = description.toLowerCase().trim();
  
  for (const rule of RULES) {
    if (rule.keywords.some(keyword => desc.includes(keyword))) {
      return rule.category;
    }
  }
  return 'Other';
};

module.exports = { suggestCategory };
