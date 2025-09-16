import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-1.5-flash-latest";

if (!GEMINI_API_KEY) {
    console.error("❌ Missing GEMINI_API_KEY in .env file");
    process.exit(1);
}

function buildPayload(prompt) {
    return {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 300,
        },
    };
}

app.post('/generate-riddle', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid prompt' });
        }
        const riddlePrompt = `
You are a master riddle smith, famed for your boundless creativity. Your defining trait is that you NEVER create the same riddle twice, even for the same theme.

Theme: "${prompt}"

Instructions:
1.  **Generate a Novelty**: To ensure every riddle is unique, you must first internally and randomly select ONE of the following creative approaches. Do not state which approach you chose.
    * **Approach A: Personification**: Write the riddle from the first-person perspective ("I have...").
    * **Approach B: Function**: Describe what the object does, not what it is.
    * **Approach C: Opposite**: Describe what the object is NOT, or what it lacks.
    * **Approach D: Wordplay**: Use a pun or a play on words related to the theme.
    * **Approach E: Poetic Metaphor**: Describe the object using figurative or poetic language.
    * **Approach F: Sensory**: Focus on how the object sounds, feels, tastes, or smells.

2.  **Compose the Riddle**: Based on your secret, random choice of approach, create a short and engaging riddle.

3.  **Strict JSON Output**: Your response must ONLY be a valid JSON object. Do not include any other text, notes, or explanations. The JSON must contain exactly two fields: "riddle" and "answer".

{
  "riddle": "...",
  "answer": "..."
}
`;



        const payload = buildPayload(riddlePrompt);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_API_KEY,
            },
            timeout: 30000,
        });

        let text = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            return res.status(502).json({ error: "No content returned from AI" });
        }

        // 🔧 Clean ```json ... ``` wrappers if present
        let cleaned = text.replace(/```json|```/g, "").trim();

        // Parse JSON safely
        let riddleData;
        try {
            riddleData = JSON.parse(cleaned);
        } catch (err) {
            console.error("⚠️ AI did not return valid JSON, raw output:", text);

            // Fallback: try extracting JSON with regex
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    riddleData = JSON.parse(match[0]);
                } catch (err2) {
                    return res.status(502).json({ error: "Invalid response format from AI", raw: text });
                }
            } else {
                return res.status(502).json({ error: "Invalid response format from AI", raw: text });
            }
        }

        res.json(riddleData);

    } catch (error) {
        console.error("🔥 Server error:", error.response?.data || error.message);
        res.status(500).json({
            error: "Internal server error",
            detail: error.response?.data || error.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on port: ${PORT}`);
});
