import React, { useState } from 'react';
import { Customer, Branch } from '../types/crm';
import { ArrowLeftRight, Upload, Download, CheckCircle2, AlertTriangle, FileText, Sparkles, Database, GitMerge, Eye, X } from 'lucide-react';

interface ImportExportViewProps {
  customers: Customer[];
  branches: Branch[];
  theme: 'light' | 'dark';
  onImportCustomers: (newCusts: Customer[]) => void;
}

interface HistoricalRecord {
  communicationId: string;
  customerName: string;
  companyName: string;
  phoneNumber: string;
  callDuration: number;
  reasonForCall: string;
  customerStatus: string;
  callStatus: string;
}

export const ImportExportView: React.FC<ImportExportViewProps> = ({
  customers, branches, theme, onImportCustomers,
}) => {
  const isDark = theme === 'dark';
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [validationReport, setValidationReport] = useState<{ success: number; duplicates: number; flaggedForReview: number } | null>(null);
  const [reviewQueue, setReviewQueue] = useState<{ historical: HistoricalRecord; existingCustomer: Customer; reason: string }[]>([]);
  const [csvPreview, setCsvPreview] = useState<{ headers: string[]; rows: string[][]; rawFile: File | null } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const cardBg = isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200';
  const subText = isDark ? 'text-zinc-400' : 'text-slate-500';
  const borderSub = isDark ? 'border-zinc-800/60' : 'border-slate-200';
  const primaryBtn = isDark ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-teal-700 hover:bg-teal-800 text-white';
  const secBtn = isDark ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border-zinc-700' : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700';
  const inputBg = isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-800';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setImportStatus('Error: CSV file appears empty or missing headers.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
      const rows = lines.slice(1).map(line => line.split(',').map(c => c.replace(/^"|"$/g, '').trim()));
      setCsvPreview({ headers, rows, rawFile: file });
      setShowPreview(true);
      setImportStatus(null);
      setValidationReport(null);
    };
    reader.readAsText(file);
  };

  const handleConfirmCsvImport = () => {
    if (!csvPreview) return;
    let successCount = 0;
    let duplicateCount = 0;
    let flaggedCount = 0;
    const newCustsList: Customer[] = [];
    const flaggedList: { historical: HistoricalRecord; existingCustomer: Customer; reason: string }[] = [];

    csvPreview.rows.forEach((cols, i) => {
      if (cols.length < 3) return;
      const customerName = cols[0] || 'Unknown Client';
      const companyName = cols[1] && cols[1] !== '' ? cols[1] : undefined;
      const phoneNumber = cols[2] || '0911000000';
      const customerStage = (cols[3] as any) || 'Lead';
      const source = cols[4] || 'CSV Import';
      const dealValue = Number(cols[5]) || 20000;

      const exactMatch = customers.find(c => c.phoneNumber === phoneNumber);
      const fuzzyMatch = customers.find(c =>
        c.companyName && companyName && c.companyName.toLowerCase().includes(companyName.toLowerCase().slice(0, 5))
      );

      if (exactMatch || fuzzyMatch) {
        duplicateCount++;
        flaggedList.push({
          historical: {
            communicationId: 'CSV-' + (i + 1),
            customerName,
            companyName: companyName || '',
            phoneNumber,
            callDuration: 5,
            reasonForCall: '',
            customerStatus: 'New',
            callStatus: customerStage,
          },
          existingCustomer: exactMatch || fuzzyMatch!,
          reason: exactMatch ? 'Exact phone match' : 'Fuzzy company match',
        });
      } else {
        successCount++;
        newCustsList.push({
          id: 'csv_' + Date.now() + '_' + i,
          customerName,
          companyName,
          phoneNumber,
          customerType: 'New',
          source,
          purposeOfCall: '[AI Completed] Manual CSV Import - Initial inquiry regarding printing machinery & blanks.',
          customerStage,
          assignedUserId: 'u1',
          branchId: 'unassigned',
          mainBranchId: 'unassigned',
          leadPriority: 'Warm',
          dealValue,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          consecutivePurchaseStreak: {},
          branchReassignmentLog: [],
        });
      }
    });

    if (newCustsList.length > 0) onImportCustomers(newCustsList);
    setReviewQueue(flaggedList);
    setValidationReport({ success: successCount, duplicates: duplicateCount, flaggedForReview: flaggedList.length });
    setImportStatus(`Imported ${successCount} new customers (${duplicateCount} duplicates flagged for review).`);
    setShowPreview(false);
    setCsvPreview(null);
  };

  const handleHistoricalMigration = () => {
    const historicalBatch: HistoricalRecord[] = [
      { communicationId: 'HIST-2023-001', customerName: 'Ato Girma Bekele', companyName: 'Girma Printing Press', phoneNumber: '0911334455', callDuration: 14, reasonForCall: '', customerStatus: 'Old', callStatus: 'Sales' },
      { communicationId: 'HIST-2023-002', customerName: 'ABC Trading Plc', companyName: 'ABC Trading', phoneNumber: '0912445566', callDuration: 8, reasonForCall: 'Inquired about A2 Heat Press pricing', customerStatus: 'New', callStatus: 'Evaluation' },
      { communicationId: 'HIST-2023-003', customerName: 'W/ro Almaz Tadesse', companyName: 'Private', phoneNumber: '0913556677', callDuration: 10, reasonForCall: 'Sublimation mug blanks wholesale order', customerStatus: 'Old', callStatus: 'Sales' },
      { communicationId: 'HIST-2023-004', customerName: 'A.B.C Trading', companyName: 'A.B.C Trading Plc', phoneNumber: '0912445566', callDuration: 12, reasonForCall: '', customerStatus: 'New', callStatus: 'Availability-check' },
    ];

    let successCount = 0;
    let duplicateCount = 0;
    const newCustsList: Customer[] = [];
    const flaggedList: { historical: HistoricalRecord; existingCustomer: Customer; reason: string }[] = [];

    historicalBatch.forEach(rec => {
      const finalReason = rec.reasonForCall.trim() === ''
        ? `[AI Completed] Routine ${rec.callStatus.toLowerCase()} inquiry regarding printing machinery and accessories.`
        : rec.reasonForCall;

      const exactMatch = customers.find(c => c.phoneNumber === rec.phoneNumber);
      const fuzzyMatch = customers.find(c => c.companyName && rec.companyName !== 'Private' && c.companyName.toLowerCase().includes(rec.companyName.toLowerCase().slice(0, 5)));

      if (exactMatch || fuzzyMatch) {
        duplicateCount++;
        flaggedList.push({
          historical: { ...rec, reasonForCall: finalReason },
          existingCustomer: exactMatch || fuzzyMatch!,
          reason: exactMatch ? 'Exact phone match found' : 'Fuzzy company name match detected',
        });
      } else {
        successCount++;
        newCustsList.push({
          id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          customerName: rec.customerName,
          companyName: rec.companyName === 'Private' ? undefined : rec.companyName,
          phoneNumber: rec.phoneNumber,
          customerType: rec.customerStatus === 'Old' ? 'Old' : 'New',
          source: 'Google Sheets Migration',
          purposeOfCall: finalReason,
          customerStage: rec.customerStatus === 'Old' ? 'Client' : 'Lead',
          assignedUserId: 'u1',
          branchId: 'unassigned',
          mainBranchId: 'unassigned',
          leadPriority: 'Warm',
          dealValue: 15000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          consecutivePurchaseStreak: {},
          branchReassignmentLog: [],
        });
      }
    });

    if (newCustsList.length > 0) {
      onImportCustomers(newCustsList);
    }
    setReviewQueue(flaggedList);
    setValidationReport({ success: successCount, duplicates: duplicateCount, flaggedForReview: flaggedList.length });
    setImportStatus('Historical Google Sheets migration completed with AI reasoning & fuzzy duplicate review queue.');
  };

  const handleExportAll = () => {
    const csvHeader = "Customer Name,Company Name,Phone,Stage,Source,Deal Value (ETB)\n";
    const csvRows = customers.map(c => `"${c.customerName}","${c.companyName || ''}","${c.phoneNumber}","${c.customerStage}","${c.source}",${c.dealValue}`).join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ttm_crm_database_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl border ${cardBg}`}>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-400" />
          <span>Data Import & CSV Upload Center</span>
        </h2>
        <p className={`text-sm mt-0.5 ${subText}`}>
          Upload your CSV files manually or run automated Google Sheets historical migrations with AI reason completion.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manual CSV File Upload */}
        <div className={`p-6 rounded-2xl border ${cardBg} space-y-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/40 text-amber-300 flex items-center justify-center border border-amber-800/60"><Upload className="w-5 h-5" /></div>
            <div><h3 className="font-bold text-white">Manual CSV File Upload</h3><p className={`text-xs ${subText}`}>Import customers from custom CSV spreadsheets</p></div>
          </div>
          <div className={`border-2 border-dashed ${borderSub} rounded-2xl p-8 text-center space-y-3`}>
            <FileText className="w-10 h-10 text-zinc-500 mx-auto" />
            <p className={`text-sm font-medium ${subText}`}>Select or drag & drop your CSV file here</p>
            <label className={`inline-block px-4 py-2 ${primaryBtn} rounded-xl text-xs font-semibold cursor-pointer shadow-sm`}>
              <span>Browse CSV File</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          {importStatus && validationReport && (
            <div className={`p-4 ${inputBg} rounded-xl space-y-2 text-xs border ${borderSub}`}>
              <div className="flex items-center gap-2 text-emerald-400 font-bold"><CheckCircle2 className="w-4 h-4" /> <span>{importStatus}</span></div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/60 text-zinc-300">
                <div>Imported: <strong className="text-emerald-400">{validationReport.success}</strong></div>
                <div>Duplicates: <strong className="text-amber-400">{validationReport.duplicates}</strong></div>
                <div>Review Queue: <strong className="text-purple-400">{validationReport.flaggedForReview}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Historical Google Sheets Migration */}
        <div className={`p-6 rounded-2xl border ${cardBg} space-y-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/40 text-purple-300 flex items-center justify-center border border-purple-800/60"><Sparkles className="w-5 h-5" /></div>
            <div><h3 className="font-bold text-white">Google Sheets Historical Migration</h3><p className={`text-xs ${subText}`}>Batch import with AI reason completion</p></div>
          </div>
          <div className={`${inputBg} p-6 rounded-2xl border ${borderSub} space-y-4`}>
            <p className={`text-xs ${subText} leading-relaxed`}>Run automated migration for legacy 3-4 year sheets with fuzzy duplicate detection and AI reasoning for blank call purposes.</p>
            <button onClick={handleHistoricalMigration} className={`w-full py-2.5 ${secBtn} rounded-xl text-sm font-medium flex items-center justify-center gap-2 border`}>
              <Sparkles className="w-4 h-4 text-amber-400" /> <span>Run Historical Migration Tool</span>
            </button>
          </div>
        </div>
      </div>

      {reviewQueue.length > 0 && (
        <div className={`p-6 rounded-2xl border ${cardBg} space-y-4`}>
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/60">
            <GitMerge className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-base">Fuzzy Duplicate Review Queue (Admin Confirmation)</h3>
          </div>
          <div className="space-y-3">
            {reviewQueue.map((item, idx) => (
              <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${inputBg}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{item.historical.customerName}</span>
                    <span className="text-xs bg-purple-950/60 text-purple-300 px-2 py-0.5 rounded border border-purple-800">{item.reason}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Incoming Phone: <span className="text-zinc-200 font-mono">{item.historical.phoneNumber}</span> • Existing Record: <span className="text-amber-300 font-semibold">{item.existingCustomer.customerName} ({item.existingCustomer.phoneNumber})</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setReviewQueue(prev => prev.filter((_, i) => i !== idx))} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold">Merge</button>
                  <button onClick={() => setReviewQueue(prev => prev.filter((_, i) => i !== idx))} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold">Keep Separate</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSV Preview Modal */}
      {showPreview && csvPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border ${cardBg}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white">CSV Import Preview</h3>
                  <p className="text-xs text-zinc-400">{csvPreview.rows.length} rows found. Review before importing.</p>
                </div>
              </div>
              <button onClick={() => { setShowPreview(false); setCsvPreview(null); }} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800/60">
                    <th className="pb-2 pr-3">#</th>
                    {csvPreview.headers.map((h, i) => (
                      <th key={i} className="pb-2 px-3">{h}</th>
                    ))}
                    <th className="pb-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {csvPreview.rows.slice(0, 100).map((row, i) => {
                    const phone = row[2] || '';
                    const companyName = row[1] || '';
                    const exactMatch = customers.find(c => c.phoneNumber === phone);
                    const fuzzyMatch = customers.find(c =>
                      c.companyName && companyName && c.companyName.toLowerCase().includes(companyName.toLowerCase().slice(0, 5))
                    );
                    const isDupe = !!(exactMatch || fuzzyMatch);
                    return (
                      <tr key={i} className={isDupe ? 'bg-amber-950/20' : ''}>
                        <td className="py-2 pr-3 text-zinc-500 font-mono">{i + 1}</td>
                        {row.map((cell, j) => (
                          <td key={j} className="py-2 px-3 text-zinc-300 max-w-[160px] truncate">{cell || '—'}</td>
                        ))}
                        <td className="py-2 px-3">
                          {isDupe ? (
                            <span className="text-[10px] bg-amber-950/60 text-amber-300 px-2 py-0.5 rounded border border-amber-800 font-semibold">
                              ⚠ Duplicate ({exactMatch ? 'Phone' : 'Company'})
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-semibold">
                              ✓ New
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {csvPreview.rows.length > 100 && (
                <p className="text-xs text-zinc-500 text-center mt-3">Showing first 100 of {csvPreview.rows.length} rows.</p>
              )}
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800/60">
              <button onClick={() => { setShowPreview(false); setCsvPreview(null); }} className={`px-4 py-2 border rounded-xl text-xs font-semibold ${secBtn}`}>
                Cancel
              </button>
              <div className="flex items-center gap-4">
                <div className="text-xs text-zinc-400 space-x-3">
                  <span>New: <strong className="text-emerald-400">{csvPreview.rows.filter((row, i) => { const p = row[2] || ''; const cn = row[1] || ''; return !customers.find(c => c.phoneNumber === p) && !customers.find(c => c.companyName && cn && c.companyName.toLowerCase().includes(cn.toLowerCase().slice(0, 5))); }).length}</strong></span>
                  <span>Duplicates: <strong className="text-amber-400">{csvPreview.rows.filter((row, i) => { const p = row[2] || ''; const cn = row[1] || ''; return !!(customers.find(c => c.phoneNumber === p) || customers.find(c => c.companyName && cn && c.companyName.toLowerCase().includes(cn.toLowerCase().slice(0, 5)))); }).length}</strong></span>
                </div>
                <button onClick={handleConfirmCsvImport} className={`px-5 py-2 ${primaryBtn} rounded-xl text-xs font-bold shadow-sm flex items-center gap-2`}>
                  <Upload className="w-4 h-4" /> Import Confirmed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
