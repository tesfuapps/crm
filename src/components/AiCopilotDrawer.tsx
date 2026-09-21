import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User as UserIcon, RefreshCw, AlertTriangle, Package, Calendar, FileText, Copy, Check } from 'lucide-react';
import { Customer, CallLog, ProductItem, Branch, User } from '../types/crm';
import { askAbe, cleanAbeText, getGeminiApiKey } from '../services/aiService';

interface AiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  callLogs: CallLog[];
  products: ProductItem[];
  branches: Branch[];
  currentUser: User;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  actionChips?: string[];
  showCopy?: boolean;
  cardType?: 'proforma' | 'followup' | null;
  cardData?: Record<string, any>;
}

export const AiCopilotDrawer: React.FC<AiCopilotDrawerProps> = ({
  isOpen,
  onClose,
  customers,
  callLogs,
  products,
  branches,
  currentUser,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: `Hello ${currentUser.name}! I am your TTM Operations Copilot. How can I assist with showroom rollups, client follow-ups, or inventory demand today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionChips: ["📊 Today's Rollup", "🚨 Open Complaints", "✍️ Draft Follow-Up"],
    },
  ]);

  if (!isOpen) return null;

  const apiKeyConfigured = Boolean(getGeminiApiKey());

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    const userMsg: Message = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setLoading(true);

    try {
      let responseText = '';
      let chips: string[] = [];
      const lower = q.toLowerCase();

      if (lower.includes('rollup') || lower.includes('summary') || lower.includes('today')) {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayCalls = callLogs.filter(c => c.dateTime.startsWith(todayStr));
        const salesCount = todayCalls.filter(c => c.callStatus === 'Sales').length;
        const complaintCount = todayCalls.filter(c => c.callStatus === 'Complaint').length;
        const serviceCount = todayCalls.filter(c => c.callStatus === 'Service').length;
        
        responseText = `📊 **Today's Showroom Rollup (${todayStr})**:\n` +
          `- Total Calls Logged: ${todayCalls.length}\n` +
          `- Sales (Closed/Made Purchase): ${salesCount}\n` +
          `- Service / Support: ${serviceCount}\n` +
          `- Complaints / Issues: ${complaintCount}\n` +
          `- Active Showrooms: ${branches.map(b => b.name).join(', ')}`;
        chips = ["🚨 Review Open Complaints", "📦 Out-of-Stock Demand"];
      } else if (lower.includes('complaint') || lower.includes('issue')) {
        const complaints = callLogs.filter(c => c.callStatus === 'Complaint');
        if (complaints.length === 0) {
          responseText = `🚨 **Open Complaints**: Zero active complaints logged in recent records! All showrooms operating smoothly.`;
        } else {
          responseText = `🚨 **Active Complaints (${complaints.length})**:\n` +
            complaints.map((c, i) => {
              const cust = customers.find(x => x.id === c.customerId);
              return `${i + 1}. **${cust?.customerName || 'Client'}** (${cust?.phoneNumber || 'N/A'}): "${c.remark}"`;
            }).join('\n');
        }
        chips = ["📊 Today's Rollup", "✍️ Draft Follow-Up"];
      } else if (lower.includes('out-of-stock') || lower.includes('stock') || lower.includes('demand')) {
        const outOfStockCalls = callLogs.filter(c => c.callStatus === 'Out of Stock');
        responseText = `📦 **Out-of-Stock & High-Demand Inquiry Report**:\n` +
          `- Total Out-of-Stock inquiry logs: ${outOfStockCalls.length}\n` +
          `- Top Requested Catalog Items: Epson L805 Printer, Double Mug Press, A3 Sublimation Paper.\n` +
          `💡 *Recommendation*: Procurement Manager advised to check container import pipeline for these items.`;
        chips = ["📊 Today's Rollup", "✍️ Draft Follow-Up"];
      } else if (lower.includes('follow-up') || lower.includes('telegram') || lower.includes('draft')) {
        responseText = `✍️ **Telegram Follow-Up Draft (Amharic / English)**:\n\n` +
          `"ሰላም! ከTTM CRM እየደወልን ነው። ስለ 5-in-1 Combo Heat Press ማሽናችን የጠየቁትን መረጃ አስመልክቶ ዛሬ 确认 ካደረጉ 5% የዋጋ ቅናሽ እናደርግልዎታለን። ቦሌ ወይም መገናኛ ማሳያ ክፍል ጎብኝተው ማየት ይችላሉ።\n\n` +
          `Hello! Following up from TTM CRM regarding your inquiry on the 5-in-1 Combo Heat Press. Confirm your order today to enjoy a 5% special showroom discount!"`;
        chips = ["📊 Today's Rollup", "🚨 Review Open Complaints"];
      } else {
        // Build CRM context for Abe
        const hotLeads = customers.filter(c => c.leadPriority === 'Hot').slice(0, 5);
        const recentSales = callLogs.filter(c => c.callStatus === 'Sales').slice(-3);
        const complaints = callLogs.filter(c => c.callStatus === 'Complaint');
        const crmContext = [
          `Total customers: ${customers.length}`,
          `Hot leads: ${hotLeads.map(c => `${c.customerName} (${c.companyName || 'N/A'})`).join(', ') || 'None'}`,
          `Recent sales calls: ${recentSales.length}`,
          `Open complaints: ${complaints.length}`,
          `Products in catalog: ${products.length}`,
          `Branches: ${branches.map(b => b.name).join(', ')}`,
        ].join('\n');
        responseText = await askAbe(q, crmContext);
        // Dynamic chips based on query context
        const lower = q.toLowerCase();
        if (lower.includes('price') || lower.includes('cost') || lower.includes('quote') || lower.includes('proforma')) {
          chips = ["📋 Create Proforma", "📊 Today's Rollup"];
        } else if (lower.includes('follow-up') || lower.includes('telegram') || lower.includes('message')) {
          chips = ["💬 Draft Amharic", "📞 View Phone Numbers"];
        } else if (lower.includes('stock') || lower.includes('out of')) {
          chips = ["📦 Check Alternatives", "📊 Today's Rollup"];
        } else {
          chips = ["📊 Today's Rollup", "✍️ Draft Follow-Up", "📦 Check Stock"];
        }
      }

      // Detect interactive card type from response
      let cardType: 'proforma' | 'followup' | null = null;
      const lowerResponse = responseText.toLowerCase();
      if (lowerResponse.includes('etb') && (lowerResponse.includes('price') || lowerResponse.includes('total') || lowerResponse.includes('quote') || lowerResponse.includes('proforma'))) {
        cardType = 'proforma';
      } else if (lowerResponse.includes('follow') || lowerResponse.includes('remind') || lowerResponse.includes('schedule')) {
        cardType = 'followup';
      }

      const aiMsg: Message = {
        id: 'ai_' + Date.now(),
        sender: 'ai',
        text: cleanAbeText(responseText),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionChips: chips,
        cardType,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: 'err_' + Date.now(),
        sender: 'ai',
        text: 'Sorry, I encountered an issue connecting to Gemini. Please check your API key in settings.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
      <div className="w-full max-w-md bg-[#141414] border-l border-neutral-800 flex flex-col h-full shadow-2xl text-neutral-200">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-[#181818]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-100">TTM Operational Copilot</h3>
              <p className="text-[10px] text-neutral-400">Abe • Gemini Flash • TTM Copilot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prompt Cards */}
        <div className="p-3 bg-[#111111] border-b border-neutral-800 grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSend("📊 Today's Showroom Rollup")}
            className="p-2 bg-[#1a1a1a] hover:bg-[#222222] border border-neutral-800 rounded-lg text-left text-xs text-neutral-300 hover:text-amber-400 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">Today's Rollup</span>
          </button>
          <button
            onClick={() => handleSend("🚨 Review Open Complaints")}
            className="p-2 bg-[#1a1a1a] hover:bg-[#222222] border border-neutral-800 rounded-lg text-left text-xs text-neutral-300 hover:text-amber-400 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="truncate">Open Complaints</span>
          </button>
          <button
            onClick={() => handleSend("📦 Out-of-Stock Demand Summary")}
            className="p-2 bg-[#1a1a1a] hover:bg-[#222222] border border-neutral-800 rounded-lg text-left text-xs text-neutral-300 hover:text-amber-400 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Package className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Out-of-Stock Demand</span>
          </button>
          <button
            onClick={() => handleSend("✍️ Draft Client Follow-Up")}
            className="p-2 bg-[#1a1a1a] hover:bg-[#222222] border border-neutral-800 rounded-lg text-left text-xs text-neutral-300 hover:text-amber-400 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Telegram Follow-Up</span>
          </button>
        </div>

        {!apiKeyConfigured && (
          <div className="mx-3 mt-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] text-amber-300 flex items-center justify-between">
            <span>⚠️ Gemini API Key not set. Using built-in local fallback responses.</span>
          </div>
        )}

        {/* Message History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="max-w-[85%] space-y-2">
                <div
                  className={`rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-wrap relative group ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-black font-medium rounded-br-xs'
                      : 'bg-[#1c1c1c] border border-neutral-800 text-neutral-200 rounded-bl-xs'
                  }`}
                >
                  {msg.text}
                  {msg.sender === 'ai' && (
                    <div className="mt-2 pt-2 border-t border-neutral-800 flex items-center justify-between">
                      <span className="text-[9px] font-mono text-neutral-500">{msg.time}</span>
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="flex items-center gap-1 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-amber-400 px-2 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === msg.id ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                  {msg.sender === 'user' && (
                    <div className="text-[9px] mt-1 text-right font-mono text-black/60">
                      {msg.time}
                    </div>
                  )}
                </div>

                {/* Interactive Proforma Quote Card */}
                {msg.sender === 'ai' && msg.cardType === 'proforma' && (
                  <div className="p-3.5 bg-[#121212] border border-neutral-800 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Proforma Quote Draft</span>
                      <span className="text-[10px] text-neutral-500 font-mono">TTM</span>
                    </div>
                    <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`TTM Equipment - Proforma Quotation\n\n${msg.text}\n\nPayment: CBE / Telebirr\nValid for 5 days.`);
                        setCopiedId(msg.id + '-quote');
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      {copiedId === msg.id + '-quote' ? (
                        <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied to Clipboard!</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copy for Telegram Chat</>
                      )}
                    </button>
                  </div>
                )}

                {/* Interactive Follow-up Booking Card */}
                {msg.sender === 'ai' && msg.cardType === 'followup' && (
                  <div className="p-3.5 bg-[#121212] border border-neutral-800 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Follow-Up Booking</span>
                      <span className="text-[10px] text-neutral-500 font-mono">Calendar</span>
                    </div>
                    <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSend("Schedule this follow-up for tomorrow morning")}
                        className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-700/40 text-emerald-400 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Confirm & Schedule
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(msg.text);
                          setCopiedId(msg.id + '-followup');
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id + '-followup' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Chips */}
                {msg.actionChips && msg.actionChips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.actionChips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(chip)}
                        className="text-[10px] font-medium bg-[#222222] hover:bg-amber-500/20 text-neutral-300 hover:text-amber-400 border border-neutral-700 hover:border-amber-500/40 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>⚡</span>
                        <span>{chip}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 items-center text-neutral-400 text-xs italic">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span>Abe is analyzing your query...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-neutral-800 bg-[#181818]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask copilot about leads, stock, complaints..."
              className="flex-1 bg-[#101010] border border-neutral-700 focus:border-amber-500 text-neutral-100 placeholder-neutral-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="h-10 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-black font-semibold text-xs rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
