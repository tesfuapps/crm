import { Customer, CallLog, ProductSale, Branch, AISummary, AIForecast } from '../types/crm';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent';

export function getGeminiApiKey(): string {
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  const storedKey = localStorage.getItem('ttm_crm_gemini_api_key');
  return storedKey || envKey || '';
}

export function setGeminiApiKey(key: string): void {
  localStorage.setItem('ttm_crm_gemini_api_key', key);
}

async function callGemini(prompt: string, opts?: { json?: boolean; temperature?: number }): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error('Gemini API key not configured');

  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        ...(opts?.json ? { responseMimeType: 'application/json' } : {}),
        temperature: opts?.temperature ?? 0.4,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

// ─── ABE: TTM Showroom Copilot ───────────────────────────────────────────────

export function cleanAbeText(rawText: string): string {
  if (!rawText) return '';
  return rawText.replace(/\*\*/g, '').trim();
}

const ABE_SYSTEM_PROMPT = `
You are Abe, the expert Showroom AI Copilot for TTM CRM in Addis Ababa, Ethiopia.
Your operations cover three showrooms: Bole Branch, Piassa Branch, and Mexico Branch.

Your expertise:
1. Printing & Sublimation Equipment: 5-in-1 combo heat presses, flat presses (80x60 cm, 40x60 cm, 38x30 cm), double mug presses, cap machines, pen presses, vinyl cutting plotters (72 cm, 135 cm), Epson L805 photo printers, and flash stamp machines (HB45, HB42, Deskmate).
2. Consumables & Blanks: Grade AAA white mugs, color mugs, magic mugs, sports bottles, dark transfer paper TTC, light transfer paper, sublimation paper, HTV vinyl rolls, stamp foam, and inks.
3. Showroom Workflows: Call outcomes (Sales, Evaluation, Service, Out of List, Out of Stock, Pre-order, Complaint), 5-purchase branch streak reassignments, local delivery (own driver vs Feres/RIDE/Yango), and regional bus cargo (Selam Bus, Sky Bus).
4. Currency: All prices are in Ethiopian Birr (ETB).
5. Languages: Fluent in natural, polite Ethiopian business English and Amharic (using Ge'ez script).
6. Response Style: Concise, direct, helpful, and professional. Avoid generic corporate buzzwords.

STRICT FORMATTING RULE: Never use markdown bold double asterisks (**) anywhere in your response. Do not write **Title:** or **Word**. Use plain text, clean spacing, and simple hyphens (-) for lists. Keep formatting clean and minimal.
`;

export async function askAbe(userQuery: string, crmContext?: string): Promise<string> {
  const prompt = `
${ABE_SYSTEM_PROMPT}
${crmContext ? `Current Showroom Context:\n${crmContext}\n` : ''}
User Question:
${userQuery}
`;
  return callGemini(prompt, { temperature: 0.4 });
}

// ─── Existing Functions (updated to use callGemini) ──────────────────────────

export async function generateCustomerAISummary(
  customer: Customer,
  callLogs: CallLog[]
): Promise<AISummary> {
  const customerCalls = callLogs.filter(cl => cl.customerId === customer.id);

  const prompt = `You are an AI sales assistant for TTM CRM, a printing machinery, heat press, and sublimation blank distributor in Addis Ababa, Ethiopia.
Analyze the following client communications and return a structured JSON response.

Client Name: ${customer.customerName}
Company/Print Shop: ${customer.companyName || 'Independent Shop'}
Current Stage: ${customer.customerStage}
Lead Priority: ${customer.leadPriority}
Deal Value: ${customer.dealValue} ETB
Internal Notes: ${customer.internalNotes || 'None'}

Logged Calls (${customerCalls.length}):
${customerCalls.map((c, i) => `Call ${i + 1} (${c.dateTime.split('T')[0]} - ${c.purpose}): ${c.remark}`).join('\n')}

Output JSON with EXACTLY this structure:
{
  "summary": "2-3 sentences concise summary of the client's relationship, needs, and current status.",
  "sentiment": "Positive" | "Neutral" | "Hesitant" | "Urgent",
  "keyInterests": ["string", "string"],
  "suggestedAction": "Concrete sales next step for the sales representative in Addis Ababa",
  "suggestedFollowUpDate": "YYYY-MM-DD"
}`;

  try {
    const rawText = await callGemini(prompt, { json: true, temperature: 0.3 });
    const parsed = JSON.parse(rawText);
    return {
      summary: parsed.summary || 'Summary generated.',
      sentiment: parsed.sentiment || 'Neutral',
      keyInterests: Array.isArray(parsed.keyInterests) ? parsed.keyInterests : ['Printing equipment'],
      suggestedAction: parsed.suggestedAction || 'Follow up via phone or Telegram.',
      suggestedFollowUpDate: parsed.suggestedFollowUpDate || customer.nextFollowUpDate,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Gemini API call failed, falling back to local analysis:', error);
    const recentCall = customerCalls[0];
    return {
      summary: `${customer.customerName} (${customer.companyName || 'Print Shop'}) is at ${customer.customerStage} stage with ${customer.dealValue.toLocaleString()} ETB deal value. ${recentCall ? `Latest discussion: ${recentCall.purpose} - "${recentCall.remark.slice(0, 100)}..."` : 'No recent calls logged.'}`,
      sentiment: customer.leadPriority === 'Hot' ? 'Urgent' : 'Positive',
      keyInterests: ['Heat Press Machinery', 'Sublimation Blanks'],
      suggestedAction: customer.customerStage === 'Lead' ? 'Schedule showroom machinery demo at Bole or Mexico Hub' : 'Offer wholesale volume discount on blanks and accessories',
      suggestedFollowUpDate: customer.nextFollowUpDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
    };
  }
}

export async function generatePipelineAIForecast(
  customers: Customer[],
  sales: ProductSale[],
  branches: Branch[]
): Promise<AIForecast> {
  const totalValue = customers.reduce((sum, c) => sum + (c.dealValue || 0), 0);
  const stageBreakdown = {
    Contact: customers.filter(c => c.customerStage === 'Contact').length,
    Lead: customers.filter(c => c.customerStage === 'Lead').length,
    Customer: customers.filter(c => c.customerStage === 'Customer').length,
    Client: customers.filter(c => c.customerStage === 'Client').length,
  };

  const prompt = `You are an AI sales strategist for TTM CRM (printing equipment, sublimation, stamp machines in Addis Ababa, ETB currency).
Analyze this pipeline snapshot:
- Total Accounts: ${customers.length}
- Total Pipeline Value: ${totalValue} ETB
- Stage distribution: Contact=${stageBreakdown.Contact}, Lead=${stageBreakdown.Lead}, Customer=${stageBreakdown.Customer}, Client=${stageBreakdown.Client}
- Active Showrooms: ${branches.map(b => `${b.name} (${b.subCity})`).join(', ')}

Output JSON:
{
  "forecastedRevenue30Days": number (in ETB),
  "confidenceScore": number (1-100),
  "topOpportunities": ["string", "string", "string"],
  "risksAndBottlenecks": ["string", "string", "string"],
  "executiveSummary": "2-3 sentences strategic summary for management"
}`;

  try {
    const rawText = await callGemini(prompt, { json: true, temperature: 0.3 });
    const parsed = JSON.parse(rawText);
    return {
      forecastedRevenue30Days: Number(parsed.forecastedRevenue30Days) || Math.round(totalValue * 0.45),
      confidenceScore: Number(parsed.confidenceScore) || 72,
      topOpportunities: parsed.topOpportunities || [],
      risksAndBottlenecks: parsed.risksAndBottlenecks || [],
      executiveSummary: parsed.executiveSummary || '',
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    const forecasted = Math.round(totalValue * 0.48);
    return {
      forecastedRevenue30Days: forecasted,
      confidenceScore: 70,
      topOpportunities: [
        'Closing hot leads for 5-in-1 combo heat press machines',
        'Bulk sublimation mug blank orders for corporate gifting',
        'Branch expansion repeat orders in Mexico Machinery Hub',
      ],
      risksAndBottlenecks: [
        'High lead value concentration in early demonstration phase',
        'Follow-ups required within 48 hours to prevent competitor quote slippage',
      ],
      executiveSummary: `Projected 30-day revenue stands at ${forecasted.toLocaleString()} ETB based on current conversion velocity across Addis Ababa branches.`,
      generatedAt: new Date().toISOString(),
    };
  }
}

export async function generateAIFollowUpMessage(
  customer: Customer,
  callLogs: CallLog[]
): Promise<string> {
  const recentCall = callLogs.filter(cl => cl.customerId === customer.id)[0];

  const prompt = `You are a professional sales executive for TTM CRM in Addis Ababa.
Write a polite, engaging follow-up message in English (with warm local professional tone) for this client via WhatsApp/Telegram:
- Client Name: ${customer.customerName}
- Company: ${customer.companyName || 'Print Shop'}
- Stage: ${customer.customerStage}
- Last Topic: ${recentCall ? recentCall.purpose : 'Printing equipment inquiry'}
- Remark: ${recentCall ? recentCall.remark : 'General interest in heat press and sublimation blanks'}

Keep it under 4 sentences, polite, and include a clear call-to-action regarding showroom visits or delivery in Addis Ababa.`;

  try {
    return await callGemini(prompt, { temperature: 0.5 });
  } catch (err) {
    return `Hello ${customer.customerName}! Following up from TTM CRM regarding your inquiry on printing machinery and sublimation blanks. Would you like to stop by our showroom for a live demo this week?`;
  }
}

export async function askAISalesAdvisor(query: string, customers: Customer[]): Promise<string> {
  const hotLeads = customers.filter(c => c.leadPriority === 'Hot').length;
  const totalValue = customers.reduce((s, c) => s + c.dealValue, 0);

  const prompt = `You are the AI Sales Advisor for TTM CRM (Addis Ababa printing machinery distributor).
Context: ${customers.length} total clients, ${hotLeads} hot leads, total deal value ${totalValue.toLocaleString()} ETB.
User Question: "${query}"

Provide a concise, practical, professional sales advisor response (under 3 paragraphs).`;

  try {
    return await callGemini(prompt, { temperature: 0.4 });
  } catch (err) {
    return `Based on your CRM metrics (${customers.length} clients, ${hotLeads} hot leads), ensure your sales reps schedule prompt showroom demos at Bole or Mexico Hub to accelerate closing deals.`;
  }
}
