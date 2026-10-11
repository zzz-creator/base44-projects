
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Lazy init inside route to prevent crash on startup if key is missing
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CENTCOM_INSTRUCTIONS = require('../config/centcom_instructions');

// System instruction for the AI defined in external file

router.post('/chat', async (req, res) => {
    console.log('[Comms] Chat request received');
    try {
        const { message, history } = req.body;
        
        console.log('[Comms] Message:', message);
        console.log('[Comms] API Key configured:', !!process.env.GEMINI_API_KEY);

        if (!process.env.GEMINI_API_KEY) {
            console.error('[Comms] Error: GEMINI_API_KEY missing');
            return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
        }

        // Initialize model
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", // Updated to a more standard model name if flash-preview is unstable, otherwise user preference
            systemInstruction: CENTCOM_INSTRUCTIONS
        });

        // Gemini history must start with a user message.
        // Convert and filter history
        let validHistory = history || [];
        while (validHistory.length > 0 && validHistory[0].role === 'model') {
            validHistory.shift();
        }

        const chat = model.startChat({
            history: validHistory,
           
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = await response.text();
        console.log('[Comms] AI Response:', text);
        res.json({ role: 'assistant', content: text });
    } catch (err) {
        console.error('Gemini API Error:', err);
        res.status(500).json({ error: 'Failed to process message with AI' });
    }
});

module.exports = router;
