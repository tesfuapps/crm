import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User as UserIcon, RefreshCw, AlertTriangle, Package, Calendar, FileText, Copy, Check, Trash2 } from 'lucide-react';
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
  timestamp: string;
  actionChips?: string[];
  cardType?: 'proforma' | 'followup' | null;
}

const WELCOME_PROMPTS = [
  { label: "Today's Rollup", desc: "Daily call & status summary", icon: "📊", prompt: "Summarize today's showroom communications rollup across all 7 statuses" },
  { label: "Open Complaints", desc: "Urgent issues needing review", icon: "🚨", prompt: "List all open complaints and technical issues reported this week" },
  { label: "Out of Stock", desc: "Unmet customer machinery demand", icon: "📦", prompt: "Which products have the highest out-of-stock customer requests right now?" },
  { label: "Telegram Follow-Up", desc: "Draft quotes in Amharic & English", icon: "✍️", prompt: "Draft a polite Telegram follow-up in Amharic for a customer evaluating an 80x60 heat press" },
];

export const AiCopilotDrawer: React.FC<AiCopilotDrawerProps> = ({
  isOpen, onClose, customers, callLogs, products, branches, currentUser,
}) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const apiKeyConfigured = Boolean(getGeminiApiKey());
  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([]);
    setInputText('');
  };

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputText;
    if (!q.trim()) return;

    const userMsg: Message = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text: q,
      timestamp: now(),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputText('');
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
        responseText = `Today's Showroom Rollup (${todayStr}):\n- Total Calls Logged: ${todayCalls.length}\n- Sales (Closed): ${salesCount}\n- Service / Support: ${serviceCount}\n- Complaints / Issues: ${complaintCount}\n- Active Showrooms: ${branches.map(b => b.name).join(', ')}`;
        chips = ["Review Complaints", "Out-of-Stock Demand"];
      } else if (lower.includes('complaint') || lower.includes('issue')) {
        const complaints = callLogs.filter(c => c.callStatus === 'Complaint');
        if (complaints.length === 0) {
          responseText = `Open Complaints: Zero active complaints logged! All showrooms operating smoothly.`;
        } else {
          responseText = `Active Complaints (${complaints.length}):\n` +
            complaints.map((c, i) => {
              const cust = customers.find(x => x.id === c.customerId);
              return `${i + 1}. ${cust?.customerName || 'Client'} (${cust?.phoneNumber || 'N/A'}): "${c.remark}"`;
            }).join('\n');
        }
        chips = ["Today's Rollup", "Draft Follow-Up"];
      } else if (lower.includes('out-of-stock') || lower.includes('stock') || lower.includes('demand')) {
        const outOfStockCalls = callLogs.filter(c => c.callStatus === 'Out of Stock');
        responseText = `Out-of-Stock & High-Demand Inquiry Report:\n- Total out-of-stock logs: ${outOfStockCalls.length}\n- Top Requested: Epson L805 Printer, Double Mug Press, A3 Sublimation Paper.\nTip: Check container import pipeline for restocking.`;
        chips = ["Today's Rollup", "Draft Follow-Up"];
      } else if (lower.includes('follow-up') || lower.includes('telegram') || lower.includes('draft')) {
        responseText = `Telegram Follow-Up Draft (Amharic / English):\n\nሰላም! ከTTM CRM እየደወልን ነው። ስለ ማሽኑ የጠየቁትን መረጃ አስመልክቶ ዛሬ confirm ካደረጉ 5% የዋጋ ቅናሽ እናደርግልዎታለን። ቦሌ ወይም መገናኛ ማሳያ ክፍል ጎብኝተው ማየት ይችላሉ።\n\nHello! Following up from TTM CRM regarding your inquiry. Confirm your order today to enjoy a 5% special showroom discount!`;
        chips = ["Today's Rollup", "Review Complaints"];
      } else {
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
        const lowerRes = responseText.toLowerCase();
        if (lowerRes.includes('etb') && (lowerRes.includes('price') || lowerRes.includes('total'))) {
          chips = ["Create Proforma", "Today's Rollup"];
        } else if (lowerRes.includes('follow') || lowerRes.includes('remind')) {
          chips = ["Draft Amharic", "View Phone Numbers"];
        } else {
          chips = ["Today's Rollup", "Draft Follow-Up", "Check Stock"];
        }
      }

      // Detect card type
      let cardType: 'proforma' | 'followup' | null = null;
      const lowerResponse = responseText.toLowerCase();
      if (lowerResponse.includes('etb') && (lowerResponse.includes('price') || lowerResponse.includes('total') || lowerResponse.includes('quote'))) {
        cardType = 'proforma';
      } else if (lowerResponse.includes('follow') || lowerResponse.includes('remind') || lowerResponse.includes('schedule')) {
        cardType = 'followup';
      }

      const aiMsg: Message = {
        id: 'ai_' + Date.now(),
        sender: 'ai',
        text: cleanAbeText(responseText),
        timestamp: now(),
        actionChips: chips,
        cardType,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: 'err_' + Date.now(),
        sender: 'ai',
        text: 'Sorry, I encountered an issue connecting to Gemini. Please check your API key in settings.',
        timestamp: now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
      <div className="w-full max-w-md bg-[#0e0e0e] border-l border-neutral-800/60 flex flex-col h-full shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800/60 bg-[#121212] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold flex items-center justify-center text-xs tracking-wider">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-neutral-100">Abe</h3>
                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Showroom AI
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5">Bole &bull; Piassa &bull; Mexico Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                title="New Conversation"
                className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!apiKeyConfigured && (
          <div className="mx-4 mt-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] text-amber-300">
            Gemini API Key not set. Using built-in local fallback responses.
          </div>
        )}

        {/* Scrollable Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col justify-center items-center text-center space-y-4 py-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl text-amber-400 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-100">How can I assist your showroom today?</h4>
                <p className="text-xs text-neutral-400 max-w-xs mt-1">
                  Ask me to summarize daily calls, check machinery inventory, or draft Telegram quotes.
                </p>
              </div>

              {/* 4 Empty State Cards */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm pt-2 text-left">
                {WELCOME_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    className="p-3 bg-[#141414] hover:bg-[#1a1a1a] border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all flex flex-col justify-between text-left group cursor-pointer"
                  >
                    <span className="text-base mb-2 block">{item.icon}</span>
                    <div>
                      <div className="text-xs font-semibold text-neutral-200 group-hover:text-amber-400 transition-colors">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5 leading-tight">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Conversation Stream */
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Message Header */}
                  <div className="flex items-center gap-2 mb-1 px-1 text-[10px] text-neutral-500">
                    <span className="font-medium">{msg.sender === 'user' ? 'You' : 'Abe'}</span>
                    <span>&bull;</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {msg.sender === 'user' ? (
                    /* User Bubble — refined dark */
                    <div className="max-w-[85%] bg-[#1e1e1e] border border-neutral-700/60 text-neutral-100 rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs shadow-sm">
                      {msg.text}
                    </div>
                  ) : (
                    /* Abe Bubble */
                    <div className="max-w-full space-y-2">
                      <div className="text-xs text-neutral-200 leading-relaxed bg-[#141414] border border-neutral-800/60 p-4 rounded-2xl rounded-tl-sm shadow-sm whitespace-pre-wrap">
                        {msg.text}
                      </div>

                      {/* Interactive Proforma Quote Card */}
                      {msg.cardType === 'proforma' && (
                        <div className="p-3.5 bg-[#111111] border border-neutral-800 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Proforma Quote Draft</span>
                            <span className="text-[10px] text-neutral-500 font-mono">TTM</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(`TTM Equipment - Proforma Quotation\n\n${msg.text}\n\nPayment: CBE / Telebirr\nValid for 5 days.`, msg.id + '-quote')}
                            className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                          >
                            {copiedId === msg.id + '-quote' ? (
                              <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied to Clipboard!</>
                            ) : (
                              <><Copy className="w-3.5 h-3.5" /> Copy for Telegram Chat</>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Interactive Follow-up Card */}
                      {msg.cardType === 'followup' && (
                        <div className="p-3.5 bg-[#111111] border border-neutral-800 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Follow-Up Booking</span>
                            <span className="text-[10px] text-neutral-500 font-mono">Calendar</span>
                          </div>
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
                              onClick={() => handleCopy(msg.text, msg.id + '-followup')}
                              className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                              {copiedId === msg.id + '-followup' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Hover Action Row */}
                      <div className="flex items-center gap-3 px-1 text-[11px] text-neutral-500">
                        <button
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="hover:text-neutral-300 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      {/* Action Chips */}
                      {msg.actionChips && msg.actionChips.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {msg.actionChips.map((chip, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSend(chip)}
                              className="text-[10px] font-medium bg-[#1a1a1a] hover:bg-amber-500/20 text-neutral-300 hover:text-amber-400 border border-neutral-700 hover:border-amber-500/40 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>{chip}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}

          {loading && (
            <div className="flex gap-3 items-center text-neutral-400 text-xs">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span>Abe is thinking...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-neutral-800/60 bg-[#121212] shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative flex items-center bg-[#0e0e0e] border border-neutral-700 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/20 rounded-xl overflow-hidden transition-all"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Abe about machinery, stock, or calls..."
              className="flex-1 bg-transparent px-4 py-3 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className={`mr-2 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                inputText.trim() && !loading
                  ? 'bg-amber-500 text-black hover:bg-amber-400 cursor-pointer shadow-sm'
                  : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
              }`}
            >
              ↑
            </button>
          </form>
          <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-neutral-500">
            <span>Powered by Gemini Flash</span>
            <span>Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
};
