import { EXPENSE_CATEGORIES } from "../types";

export async function suggestCategory(name: string, notes: string): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (!apiKey) return "MISLINIUS";

    const prompt = `Based on the transaction name "${name}" and notes "${notes}", suggest the best category from this list: ${EXPENSE_CATEGORIES.join(', ')}. Return only the category name in plain text.`;
    
    const response = await window.fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: "You are a financial assistant. Return only the category name from the provided list." }] }
      })
    });

    const data = await response.json();
    const suggestion = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim().toUpperCase();

    if (EXPENSE_CATEGORIES.includes(suggestion)) {
      return suggestion;
    }
    return "MISLINIUS";
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return "MISLINIUS";
  }
}

export async function batchCategorize(transactions: { name: string; notes: string; id: number }[]) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (!apiKey) return [];

    const list = transactions.map(t => `ID ${t.id}: Name="${t.name}", Notes="${t.notes}"`).join('\n');
    const prompt = `Categorize these transactions into one of: ${EXPENSE_CATEGORIES.join(', ')}. Return a JSON array of objects with { "id": number, "category": string }.\n\nTransactions:\n${list}`;
    
    const response = await window.fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Batch Suggestion Error:", error);
    return [];
  }
}
