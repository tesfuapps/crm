import React, { useState } from 'react';
import { Customer, Branch } from '../types/crm';
import { ArrowLeftRight, Upload, Download, CheckCircle2, AlertTriangle, FileText, Sparkles, Database, GitMerge } from 'lucide-react';

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

  const cardBg = isDark ? 'bg-[#18181b] border-zinc-800/60' : 'bg-white border-slate-200';
  const subText = isDark ? 'text-zinc-400' : 'text-slate-500';
  const borderSub = isDark ? 'border-zinc-800/60' : 'border-slate-200';
  const primaryBtn = isDark ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-teal-700 hover:bg-teal-800 text-white';
  const secBtn = isDark ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border-zinc-700' : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700';
  const inputBg = isDark ? 'bg-[#1F2937] border-zinc-700 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-800';

  const handleHistoricalMigration = () => {
    // Simulated historical Google Sheets 3-4 years data batch with intentional fuzzy duplicates & blank reasons
    const historicalBatch: HistoricalRecord[] = [
      { communicationId: 'HIST-2023-001', customerName: 'Ato Girma Bekele', companyName: 'Girma Printing Press', phoneNumber: '0911334455', callDuration: 14, reasonForCall: '', customerStatus: 'Old', callStatus: 'Sales' },
      { communicationId: 'HIST-2023-002', customerName: 'ABC Trading Plc', companyName: 'ABC Trading', phoneNumber: '0912445566', callDuration: 8, reasonForCall: 'Inquired about A2 Heat Press pricing', customerStatus: 'New', callStatus: 'Evaluation' },
      { communicationId: 'HIST-2023-003', customerName: 'W/ro Almaz Tadesse', companyName: 'Private', phoneNumber: '0913556677', callDuration: 10, reasonForCall: 'Sublimation mug blanks wholesale order', customerStatus: 'Old', callStatus: 'Sales' },
      { communicationId: 'HIST-2023-004', customerName: 'A.B.C Trading', companyName: 'A.B.C Trading Plc', phoneNumber: '0912445566', callDuration: 12, reasonForCall: '', customerStatus: 'New', callStatus: 'Availability-check' }, // Fuzzy duplicate test
    ];

    let successCount = 0;
    let duplicateCount = 0;
    const newCustsList: Customer[] = [];
    const flaggedList: { historical: HistoricalRecord; existingCustomer: Customer; reason: string }[] = [];

    historicalBatch.forEach(rec => {
      // AI Reason Completion if blank
      const finalReason = rec.reasonForCall.trim() === ''
        ? `[AI Completed] Routine ${rec.callStatus.toLowerCase()} inquiry regarding printing machinery and accessories.`
        : rec.reasonForCall;

      // Fuzzy duplicate detection by phone or similar company name
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
          branchId: 'unassigned', // Default unassigned per spec
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
    link.setAttribute("download", `ttm_crm_historical_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl border ${cardBg}`}>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-400" />
          <span>Historical Google Sheets Migration & Bulk Data Import</span>
        </h2>
        <p className={`text-sm mt-0.5 ${subText}`}>
          Import 3-4+ years of manual communication logs with automated AI reason completion and fuzzy duplicate merging for Admin review.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-xl border ${cardBg} space-y-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-950/40 text-amber-300 flex items-center justify-center border border-amber-800/60"><Upload className="w-5 h-5" /></div>
            <div><h3 className="font-bold text-white">Google Sheets Historical Import</h3><p className={`text-xs ${subText}`}>Structured CSV migration with AI reasoning</p></div>
          </div>
          <div className={`border-2 border-dashed ${borderSub} rounded-xl p-8 text-center space-y-3`}>
            <FileText className="w-10 h-10 text-zinc-500 mx-auto" />
            <p className={`text-sm font-medium ${subText}`}>Upload historical Sheets export (CSV)</p>
            <button onClick={handleHistoricalMigration} className={`px-4 py-2 ${primaryBtn} rounded-lg text-xs font-medium flex items-center gap-1.5 mx-auto`}>
              <Sparkles className="w-4 h-4" />
              <span>Run Historical Migration & AI Import</span>
            </button>
          </div>
          {importStatus && validationReport && (
            <div className={`p-4 ${inputBg} rounded-lg space-y-2 text-xs border ${borderSub}`}>
              <div className="flex items-center gap-2 text-emerald-400 font-bold"><CheckCircle2 className="w-4 h-4" /> <span>{importStatus}</span></div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/60 text-zinc-300">
                <div>Imported: <strong className="text-emerald-400">{validationReport.success}</strong></div>
                <div>Duplicates: <strong className="text-amber-400">{validationReport.duplicates}</strong></div>
                <div>Flagged Review: <strong className="text-purple-400">{validationReport.flaggedForReview}</strong></div>
              </div>
            </div>
          )}
        </div>

        <div className={`p-6 rounded-xl border ${cardBg} space-y-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-950/40 text-blue-300 flex items-center justify-center border border-blue-800/60"><Download className="w-5 h-5" /></div>
            <div><h3 className="font-bold text-white">Export CRM Database</h3><p className={`text-xs ${subText}`}>Download customer records to CSV</p></div>
          </div>
          <div className={`${inputBg} p-6 rounded-xl border ${borderSub} space-y-4`}>
            <p className={`text-xs ${subText} leading-relaxed`}>Export all {customers.length} customer records along with historical call logs, deal values, and status tags for offline analysis.</p>
            <button onClick={handleExportAll} className={`w-full py-2.5 ${secBtn} rounded-lg text-sm font-medium flex items-center justify-center gap-2`}>
              <Download className="w-4 h-4" /> <span>Download Full Database CSV</span>
            </button>
          </div>
        </div>
      </div>

      {reviewQueue.length > 0 && (
        <div className={`p-6 rounded-xl border ${cardBg} space-y-4`}>
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
    </div>
  );
};
