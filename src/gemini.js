// src/gemini.js

// ⚠️ SECURITY WARNING: In a real production app, never store keys in code!
// For this learning project, it is fine, but don't publish this to public GitHub.
const API_KEY = "AIzaSyB1csP9OOT-YyC8gmEm3vPUzhk-LcRlg8E"; 

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;

export const fetchGeminiResponse = async (userMessage, context = "") => {
  try {
    // 1. Construct the payload
    // We include "context" (financial data) as a system instruction logic
    const payload = {
      contents: [{
        parts: [{
          text: `
            You are a helpful, concise Financial Advisor. 
            RULES:
            1. Keep answers short (max 4-5 sentences).
            2. Do not use bullet points unless necessary.
            3. Be direct and friendly.
            
            CONTEXT: ${context}
            
            USER QUESTION: ${userMessage}
          `
        }]
      }]
    };

    // 2. Make the API Call
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();

    // 3. Extract the text response
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return aiText || "Sorry, I didn't understand that.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I am having trouble connecting to the brain right now. Try again later.";
  }
};