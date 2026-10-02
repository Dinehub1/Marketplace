require('dotenv').config();

const OPENROUTER_URL = process.env.EXPO_PUBLIC_AI_BASE_URL;
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_AI_API_KEY;
const MODEL = process.env.EXPO_PUBLIC_AI_MODEL;

async function test() {
    console.log(`Testing model: ${MODEL}`);
    console.log(`Using URL: ${OPENROUTER_URL}`);

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
                messages: [{ role: 'user', content: 'Say hello!' }]
            })
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`Error: ${res.status} ${text}`);
            return;
        }

        const data = await res.json();
        console.log('Success! Response:');
        console.log(JSON.stringify(data.choices[0], null, 2));

    } catch (err) {
        console.error('Fetch error:', err);
    }
}

test();
