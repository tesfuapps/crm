import React from 'react';

interface SystemHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemHelpModal: React.FC<SystemHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const faqs = [
    {
      q: "📞 How do I categorize calls using the 7 Core Outcomes?",
      a: "Every logged call must be assigned one outcome: Sales (confirmed purchase), Out of Stock (unmet demand alerting procurement), Evaluation (quote or price check), Service (equipment repairs), Complaint (escalates to Owner/Admin), Pre-order (container import requests), or Out of List (unsupported products)."
    },
    {
      q: "⚡ How does the 5-Purchase Branch Streak work?",
      a: "If a customer assigned to Bole makes 5 consecutive purchases at Piassa without buying elsewhere, the system automatically transfers their main branch to Piassa and alerts the team."
    },
    {
      q: "⌨️ What keyboard shortcuts can I use?",
      a: "Press Ctrl + G (or Cmd + G) anywhere to open the Global Command Palette. You can search customers, equipment catalog items, or navigate to any page."
    },
    {
      q: "📊 How do I export data for weekly management meetings?",
      a: "On the Communications Feed, apply your filters (e.g. 'This Week' + 'Bole Showroom') and click 'Actions & Export' → 'Export to Excel (.xlsx)' or 'Export to CSV'."
    },
    {
      q: "✨ How can Abe (Showroom AI) assist my daily work?",
      a: "Click the sparkle icon in the header to ask Abe for instant daily rollups, check out-of-stock equipment demand, or draft polite customer follow-up messages in Amharic and English."
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#161616] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#191919]">
          <div className="flex items-center gap-2.5">
            <span className="text-amber-500 text-lg">❓</span>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">TTM CRM — Operations Guide & FAQ</h3>
              <p className="text-[11px] text-neutral-400">Standard procedures for showroom reps and managers</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer">✕</button>
        </div>

        {/* FAQ Accordion List */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-[#121212] border border-neutral-800/80 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-neutral-200">{faq.q}</h4>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-[#141414] text-center text-[11px] text-neutral-500">
          For system issues or administrative permissions, contact Dawit Bekele (System Administrator).
        </div>
      </div>
    </div>
  );
};
