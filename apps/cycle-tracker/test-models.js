require('dotenv').config();

const OPENROUTER_URL = process.env.EXPO_PUBLIC_AI_BASE_URL;
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_AI_API_KEY;

async function testFreeModels() {
    const modelsToTest = [
        'google/gemini-2.0-pro-exp-0205:free',
        'google/gemini-2.0-flash-lite-preview-02-05:free',
        'mistralai/pixtral-12b:free',
        'qwen/qwen-2.5-72b-instruct:free',
        'meta-llama/llama-3.1-8b-instruct:free',
        'nvidia/llama-3.1-nemotron-70b-instruct:free',
        'nousresearch/hermes-3-llama-3.1-405b:free'
    ];

    for (const model of modelsToTest) {
        console.log(`\nTesting ${model}...`);
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
                    model: model,
                    messages: [{ role: 'user', content: 'Reply with simply "working"' }]
                })
            });

            const text = await res.text();
            if (res.ok) {
                console.log(`✅ SUCCESS for ${model}!`);
                return; // Found a working one
            } else {
                console.log(`❌ FAILED for ${model} - ${res.status}: ${text.substring(0, 100)}`);
            }
        } catch (e) {
            console.log(`❌ ERROR for ${model}: ${e.message}`);
        }
        // Wait a sec to avoid hitting another limit
        await new Promise(r => setTimeout(r, 1000));
    }
}

testFreeModels();
