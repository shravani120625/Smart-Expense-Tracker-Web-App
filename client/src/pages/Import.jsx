import React, { useState } from 'react';
import { importService, transactionService } from '../services/api';
import { 
  Upload, FileSpreadsheet, Eye, FileImage, 
  Sparkles, CheckCircle2, AlertCircle, ScanLine 
} from 'lucide-react';

const Import = () => {
  // CSV States
  const [csvFile, setCsvFile] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvSuccess, setCsvSuccess] = useState('');
  const [csvError, setCsvError] = useState('');

  // OCR States
  const [ocrImage, setOcrImage] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [parsedReceipt, setParsedReceipt] = useState(null);
  const [savingReceipt, setSavingReceipt] = useState(false);

  // CSV Submit
  const handleCSVSubmit = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    setCsvError('');
    setCsvSuccess('');
    setCsvLoading(true);

    try {
      const res = await importService.uploadCSV(csvFile);
      if (res.success) {
        setCsvSuccess(res.message || `Successfully imported transactions!`);
        setCsvFile(null);
      }
    } catch (err) {
      setCsvError(err.message || 'Error processing CSV file. Check format.');
    } finally {
      setCsvLoading(false);
    }
  };

  // OCR Submit
  const handleOCRSubmit = async (e) => {
    e.preventDefault();
    if (!ocrImage) return;
    setOcrError('');
    setOcrSuccess('');
    setParsedReceipt(null);
    setOcrLoading(true);

    try {
      const res = await importService.uploadOCR(ocrImage);
      if (res.success) {
        setOcrSuccess('Receipt text extracted successfully! Please review below.');
        setParsedReceipt(res.data);
        setOcrImage(null);
      }
    } catch (err) {
      setOcrError(err.message || 'OCR parsing failed.');
    } finally {
      setOcrLoading(false);
    }
  };

  // Save parsed receipt to transactions DB
  const handleSaveReceipt = async () => {
    if (!parsedReceipt) return;
    setOcrError('');
    setSavingReceipt(true);

    try {
      const res = await transactionService.create({
        amount: parsedReceipt.amount,
        type: 'expense',
        currency: parsedReceipt.currency,
        description: parsedReceipt.description,
        category: parsedReceipt.category,
        date: parsedReceipt.date,
        source: 'ocr'
      });

      if (res.success) {
        setOcrSuccess('Receipt transaction successfully saved into database!');
        setParsedReceipt(null);
      }
    } catch (err) {
      setOcrError(err.message || 'Saving receipt transaction failed.');
    } finally {
      setSavingReceipt(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Statements & Receipt Import</h1>
        <p className="text-slate-400 text-sm">Automate expense tracking by uploading banking spreadsheets or scanning receipts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* CSV Import Section */}
        <div className="glass-card flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
              CSV Bank Statement Import
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              Upload standard banking exports or spreadsheets. The columns will be scanned for amount, date, and description.
            </p>

            {csvError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {csvError}
              </div>
            )}

            {csvSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {csvSuccess}
              </div>
            )}

            <form onSubmit={handleCSVSubmit} className="space-y-4">
              <div className="border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60 rounded-xl p-6 text-center cursor-pointer transition-all duration-200 relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    setCsvFile(e.target.files[0]);
                    setCsvError('');
                    setCsvSuccess('');
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required
                />
                <Upload className="h-8 w-8 text-slate-500 mx-auto mb-3" />
                <span className="block text-xs font-semibold text-slate-300">
                  {csvFile ? csvFile.name : 'Select or drop statement CSV'}
                </span>
                <span className="block text-[10px] text-slate-500 mt-1">Accepts CSV tables up to 10MB</span>
              </div>

              <button
                type="submit"
                disabled={csvLoading || !csvFile}
                className="btn-primary w-full text-xs font-bold"
              >
                {csvLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Upload CSV Statement'
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-850">
            <span className="text-[10px] text-slate-500 block">💡 Standard CSV layout tips:</span>
            <span className="text-[9px] text-slate-500 block mt-1">Columns must include headers such as: Date, Description (or Particulars), and Amount.</span>
          </div>
        </div>

        {/* OCR Uploader Section */}
        <div className="glass-card flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <FileImage className="h-5 w-5 text-indigo-400" />
              Receipt OCR Stub
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              Scan invoice receipts. The simulated OCR text processor scans receipts to suggest transaction fields.
            </p>

            {ocrError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {ocrError}
              </div>
            )}

            {ocrSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {ocrSuccess}
              </div>
            )}

            <form onSubmit={handleOCRSubmit} className="space-y-4">
              <div className="border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60 rounded-xl p-6 text-center cursor-pointer transition-all duration-200 relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setOcrImage(e.target.files[0]);
                    setOcrError('');
                    setOcrSuccess('');
                    setParsedReceipt(null);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required
                />
                <Eye className="h-8 w-8 text-slate-500 mx-auto mb-3" />
                <span className="block text-xs font-semibold text-slate-300">
                  {ocrImage ? ocrImage.name : 'Select or drop receipt image'}
                </span>
                <span className="block text-[10px] text-slate-500 mt-1">JPG, PNG, WebP</span>
              </div>

              <button
                type="submit"
                disabled={ocrLoading || !ocrImage}
                className="btn-primary w-full text-xs font-bold"
              >
                {ocrLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Scan Receipt Image'
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-850">
            <span className="text-[10px] text-slate-500 block">💡 Receipt OCR scanning stub details:</span>
            <span className="text-[9px] text-slate-500 block mt-1">This uses a backend mockup script to demonstrate OCR data extraction algorithms.</span>
          </div>
        </div>

      </div>

      {/* OCR Result View Card */}
      {parsedReceipt && (
        <div className="mt-8 glass-card border border-indigo-500/20 bg-slate-900/80 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Left panel: Parsed Fields validation form */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Extracted Transaction Fields
            </h4>
            
            <div className="space-y-3 bg-slate-950/40 p-4 border border-slate-850 rounded-xl text-xs">
              <div className="grid grid-cols-3 py-1.5 border-b border-slate-850">
                <span className="text-slate-400 font-semibold">Store / Merchant</span>
                <span className="col-span-2 text-white font-bold">{parsedReceipt.merchant}</span>
              </div>
              <div className="grid grid-cols-3 py-1.5 border-b border-slate-850">
                <span className="text-slate-400 font-semibold">Amount</span>
                <span className="col-span-2 text-white font-bold">{parsedReceipt.amount} {parsedReceipt.currency}</span>
              </div>
              <div className="grid grid-cols-3 py-1.5 border-b border-slate-850">
                <span className="text-slate-400 font-semibold">Category Suggested</span>
                <span className="col-span-2 text-white font-bold capitalize">{parsedReceipt.category}</span>
              </div>
              <div className="grid grid-cols-3 py-1.5 border-b border-slate-850">
                <span className="text-slate-400 font-semibold">Date Identified</span>
                <span className="col-span-2 text-white font-bold">{parsedReceipt.date}</span>
              </div>
              <div className="grid grid-cols-3 py-1.5">
                <span className="text-slate-400 font-semibold">Description</span>
                <span className="col-span-2 text-slate-300">{parsedReceipt.description}</span>
              </div>
            </div>

            <button
              onClick={handleSaveReceipt}
              disabled={savingReceipt}
              className="btn-primary w-full text-xs font-bold mt-4"
            >
              {savingReceipt ? 'Importing...' : 'Import Parsed Receipt'}
            </button>
          </div>

          {/* Right panel: raw lines matched preview */}
          <div>
            <h4 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-1.5">
              <ScanLine className="h-4 w-4" />
              Receipt Printer Paper Mock (OCR Raw Scan Output)
            </h4>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-[10px] text-slate-400 leading-relaxed overflow-x-auto select-none shadow-inner h-[180px]">
              {parsedReceipt.lines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Import;
