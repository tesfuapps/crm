import React, { useState } from 'react';
import { Customer, Branch } from '../types/crm';
import { ArrowLeftRight, Upload, Download, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface ImportExportViewProps {
  customers: Customer[];
  branches: Branch[];
  onImportCustomers: (newCusts: Customer[]) => void;
}

export const ImportExportView: React.FC<ImportExportViewProps> = ({
  customers,
  branches,
  onImportCustomers,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [validationReport, setValidationReport] = useState<{ success: number; duplicates: number; errors: number } | null>(null);

  const handleSimulateImport = () => {
    // Simulated imported rows with duplicate checking on phone numbers
    const sampleImported = [
      {
        customerName: 'Ato Mesfin Wondwossen',
        companyName: 'Mesfin Tech Solutions',
        phoneNumber: '0911223344', // Duplicate phone in seed data
        source: 'Telegram',
        customerStage: 'Contact' as const,
        dealValue: 20000,
      },
      {
        customerName: 'W/ro Seble Demissie',
        companyName: 'Seble Cafe & Restaurant',
        phoneNumber: '0919988776', // New
        source: 'Referral',
        customerStage: 'Lead' as const,
        dealValue: 18000,
      }
    ];

    let successCount = 0;
    let duplicateCount = 0;
    const newCustsList: Customer[] = [];

    sampleImported.forEach(imp => {
      const existing = customers.find(c => c.phoneNumber === imp.phoneNumber);
      if (existing) {
        duplicateCount++;
      } else {
        successCount++;
        newCustsList.push({
          id: 'imp_' + Date.now() + Math.random(),
          customerName: imp.customerName,
          companyName: imp.companyName,
          phoneNumber: imp.phoneNumber,
          customerType: 'New',
          source: imp.source,
          purposeOfCall: 'Imported via CSV/Excel spreadsheet',
          customerStage: imp.customerStage,
          assignedUserId: 'u1',
          branchId: branches[0]?.id || 'b1',
          leadPriority: 'Warm',
          dealValue: imp.dealValue,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    if (newCustsList.length > 0) {
      onImportCustomers(newCustsList);
    }

    setValidationReport({ success: successCount, duplicates: duplicateCount, errors: 0 });
    setImportStatus('Import completed successfully with duplicate check.');
  };

  const handleExportAll = () => {
    const csvHeader = "Customer Name,Company Name,Phone,Stage,Source,Deal Value (ETB)\n";
    const csvRows = customers.map(c => 
      `"${c.customerName}","${c.companyName || ''}","${c.phoneNumber}","${c.customerStage}","${c.source}",${c.dealValue}`
    ).join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ttm_crm_customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">Data Import & Export Center</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Import customer databases from CSV, Excel, or Google Contacts with automated duplicate phone number detection.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Box */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Import Customers (CSV / Excel)</h3>
              <p className="text-xs text-slate-500">Upload spreadsheets with duplicate detection</p>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm text-slate-600 font-medium">Drag & drop your CSV or Excel file here, or click to browse</p>
            <button
              onClick={handleSimulateImport}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              Simulate Spreadsheet Import
            </button>
          </div>

          {importStatus && validationReport && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{importStatus}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-slate-700">
                <div>Successful: <strong className="text-emerald-700">{validationReport.success}</strong></div>
                <div>Duplicates Skipped: <strong className="text-amber-600">{validationReport.duplicates}</strong></div>
                <div>Errors: <strong className="text-slate-800">{validationReport.errors}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Export Box */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Export CRM Database</h3>
              <p className="text-xs text-slate-500">Download customer records, deals, and logs to CSV</p>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Export all {customers.length} customer records along with deal values, stages, and source tags for offline analysis in Excel or Google Sheets.
            </p>
            <button
              onClick={handleExportAll}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Full Customers CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
