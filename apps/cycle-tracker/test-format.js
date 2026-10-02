require('dotenv').config();

const OPENROUTER_URL = process.env.EXPO_PUBLIC_AI_BASE_URL;
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_AI_API_KEY;
const MODEL = process.env.EXPO_PUBLIC_AI_MODEL;

async function testFormat() {
    try {
        const res = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://cycle-tracker.app',
                'X-Title': 'Cycle Tracker AI',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: 'You are a menstrual cycle prediction engine. Respond ONLY with valid JSON.' },
                    { role: 'user', content: 'Today date: 2026-02-22. Cycle length: 28. Give prediction.' }
                ]
            })
        });

        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Raw Response:\n${text}`);

    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testFormat();
