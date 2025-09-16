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
You are a creative riddle generator.
Theme: "${prompt}"

Instructions:
1. Every time this request is made, generate a *different and unique* riddle, even if the same theme is repeated.
2. Use randomness in style: sometimes use humor, sometimes use mystery, sometimes use wordplay.
3. Ensure no two riddles are identical — change wording, perspective, or difficulty.
4. Output must ONLY be valid JSON with exactly two fields:
{
  "riddle": "...",
  "answer": "..."
}
5. Keep it short, engaging, and suitable for all ages.
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
