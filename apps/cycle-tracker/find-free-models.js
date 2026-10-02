require('dotenv').config();
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_AI_API_KEY;

async function findFreeModels() {
    try {
        const res = await fetch('https://openrouter.ai/api/v1/models');
        const data = await res.json();
        const freeModels = data.data.filter(m =>
            m.pricing.prompt === "0" && m.pricing.completion === "0"
        ).map(m => m.id);

        console.log(`Found ${freeModels.length} free models:`);
        console.log(freeModels.join('\n'));

        // Test the first 5 to find one that works
        for (const model of freeModels.slice(0, 5)) {
            console.log(`\nTesting ${model}...`);
            const testRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: 'Say hello' }]
                })
            });
            if (testRes.ok) {
                console.log(`✅ SUCCESS for ${model}!`);
                return;
            } else {
                const txt = await testRes.text();
                console.log(`❌ FAILED for ${model} - ${testRes.status} ${txt.substring(0, 100)}`);
            }
            await new Promise(r => setTimeout(r, 1000));
        }
    } catch (e) { console.error(e); }
}

findFreeModels();
