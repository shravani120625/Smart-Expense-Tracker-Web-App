const fs = require('fs');
const csv = require('csv-parser');
const Transaction = require('../models/Transaction');
const { suggestCategory } = require('../utils/categorizer');
const { convertCurrency } = require('../utils/currency');

// @desc    Import transactions from CSV statement
// @route   POST /api/import/csv
// @access  Private
exports.importCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a CSV file' });
    }

    const userId = req.user.id;
    const userCurrency = req.user.currency || 'INR';
    const filePath = req.file.path;
    const transactionsToInsert = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Find keys dynamically (case-insensitive)
        const keys = Object.keys(row);
        
        const dateKey = keys.find(k => k.toLowerCase() === 'date');
        const descKey = keys.find(k => k.toLowerCase() === 'description' || k.toLowerCase() === 'memo' || k.toLowerCase() === 'particulars');
        const amountKey = keys.find(k => k.toLowerCase() === 'amount');
        const typeKey = keys.find(k => k.toLowerCase() === 'type'); // 'income' or 'expense'
        const currencyKey = keys.find(k => k.toLowerCase() === 'currency');

        // Extract values
        const rawDate = dateKey ? row[dateKey] : new Date();
        const description = descKey ? row[descKey].trim() : 'CSV Import';
        let amount = amountKey ? parseFloat(row[amountKey].replace(/[^0-9.-]/g, '')) : 0;
        let type = typeKey ? row[typeKey].toLowerCase().trim() : '';
        const currency = currencyKey ? row[currencyKey].toUpperCase().trim() : userCurrency;

        // Clean values
        if (isNaN(amount)) amount = 0;

        // If type is not explicitly provided, deduce from positive/negative amount
        if (!type || (type !== 'income' && type !== 'expense')) {
          type = amount >= 0 ? 'income' : 'expense';
        }
        
        // Amount must be stored as positive; type governs addition/subtraction
        const finalAmount = Math.abs(amount);

        // Deduce category
        const category = suggestCategory(description);

        // Convert base amount
        const amountBase = convertCurrency(finalAmount, currency, userCurrency);

        if (finalAmount > 0) {
          transactionsToInsert.push({
            user: userId,
            amount: finalAmount,
            type,
            currency,
            amountBase,
            description,
            category,
            date: new Date(rawDate),
            source: 'csv'
          });
        }
      })
      .on('end', async () => {
        try {
          if (transactionsToInsert.length > 0) {
            await Transaction.insertMany(transactionsToInsert);
          }
          
          // Delete temp upload file
          fs.unlinkSync(filePath);

          res.status(200).json({
            success: true,
            message: `Successfully imported ${transactionsToInsert.length} transactions from statement`,
            count: transactionsToInsert.length
          });
        } catch (dbErr) {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          res.status(500).json({ success: false, error: 'Database saving failed during CSV import: ' + dbErr.message });
        }
      })
      .on('error', (err) => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ success: false, error: 'Error reading CSV file: ' + err.message });
      });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    OCR stub to parse receipt details from image upload
// @route   POST /api/import/ocr
// @access  Private
exports.importOCR = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a receipt image' });
    }

    // Mock processing - simulates extracting text values using OCR APIs like Tesseract or Google Cloud Vision
    // We parse the image filename or just return a smart mock representing a coffee receipt!
    const mockMerchant = 'Blue Tokai Coffee Roasters';
    const mockAmount = 240.00;
    const mockCurrency = 'INR';
    const mockCategory = 'Food';
    const mockDescription = 'Blue Tokai - Flat White Coffee';
    const mockDate = new Date().toISOString().slice(0, 10);

    // Simulated OCR Lines parsed
    const parsedTextLines = [
      'BLUE TOKAI COFFEE ROASTERS',
      'STORE #42 - BANJARA HILLS',
      'DATE: ' + new Date().toLocaleDateString(),
      '--------------------------------',
      '1x FLAT WHITE         220.00 INR',
      'CGST 5%                10.00 INR',
      'SGST 5%                10.00 INR',
      '--------------------------------',
      'TOTAL DUE             240.00 INR',
      'PAID VIA UPI           THANK YOU!'
    ];

    // Delete uploaded image file since it's just a simulation
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(200).json({
      success: true,
      message: 'Receipt parsed successfully via OCR simulation',
      data: {
        merchant: mockMerchant,
        amount: mockAmount,
        currency: mockCurrency,
        category: mockCategory,
        description: mockDescription,
        date: mockDate,
        lines: parsedTextLines
      }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, error: error.message });
  }
};
