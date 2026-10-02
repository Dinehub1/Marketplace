import { AIPrediction, CycleData, UserProfile } from '@/types';

const OPENROUTER_URL = process.env.EXPO_PUBLIC_AI_BASE_URL!;
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_AI_API_KEY!;
const MODEL = process.env.EXPO_PUBLIC_AI_MODEL!;

if (!OPENROUTER_URL || !OPENROUTER_API_KEY || !MODEL) {
    console.error('[AI] Missing env vars. Ensure EXPO_PUBLIC_AI_BASE_URL, EXPO_PUBLIC_AI_API_KEY, and EXPO_PUBLIC_AI_MODEL are set in .env');
}

// Generate a simple hash of cycle data to detect changes
export function generateDataHash(cycleData: CycleData): string {
    const key = `${cycleData.lastPeriodStart}-${cycleData.entries.length}-${cycleData.cycleLength}-${cycleData.periodLength}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

// Build the system prompt for cycle prediction
function buildSystemPrompt(): string {
    return `You are a deterministic menstrual cycle prediction engine.

You MUST respond with valid JSON only.
Do NOT include markdown.
Do NOT include explanations.
Do NOT include reasoning.
Do NOT include backticks.
Do NOT include extra keys.
Do NOT include commentary.

Return ONLY a valid JSON object with exactly these keys:

{
  "nextPeriodDate": "YYYY-MM-DD",
  "predictedCycleLength": number,
  "fertileWindowStart": "YYYY-MM-DD",
  "fertileWindowEnd": "YYYY-MM-DD",
  "insights": ["string"],
  "tips": ["string"],
  "confidence": number
}

Rules:
- Use ISO date format (YYYY-MM-DD).
- confidence must be between 0 and 1.
- If data is insufficient, set confidence to 0.
- predictedCycleLength must be a number.
- insights and tips must be short sentences.
- Do not return empty strings.
- Do not explain calculations.
- Do not output anything outside JSON.`;
}

// Build user message with cycle data context
function buildUserMessage(cycleData: CycleData, profile: UserProfile): string {
    const recentEntries = cycleData.entries.slice(0, 30);

    const periodDates = recentEntries
        .filter(e => e.flow && e.flow !== 'none')
        .map(e => ({ date: e.date, flow: e.flow }));

    const moodEntries = recentEntries
        .filter(e => e.mood)
        .map(e => ({ date: e.date, mood: e.mood }));

    const symptomEntries = recentEntries
        .filter(e => e.symptoms && e.symptoms.length > 0)
        .map(e => ({ date: e.date, symptoms: e.symptoms }));

    const bbtEntries = recentEntries
        .filter(e => e.bbt && e.bbt > 0)
        .map(e => ({ date: e.date, bbt: e.bbt }));

    const today = new Date().toISOString().split('T')[0];

    return `Today's date: ${today}
User goal: ${profile.goal}
Cycle length setting: ${cycleData.cycleLength} days
Period length setting: ${cycleData.periodLength} days
Last period start: ${cycleData.lastPeriodStart || 'Not set'}
Total logged entries: ${cycleData.entries.length}

Period flow data: ${JSON.stringify(periodDates)}
Mood data: ${JSON.stringify(moodEntries)}
Symptom data: ${JSON.stringify(symptomEntries)}
${bbtEntries.length > 0 ? `BBT data: ${JSON.stringify(bbtEntries)}` : ''}

Analyze this data and provide cycle predictions.`;
}

// Clean response (remove <think> tags or markdown fences)
function cleanResponse(text: string): string {
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return cleaned;
}

// Main AI prediction function — direct API call, no retries, no fallbacks
export async function getAIPrediction(
    cycleData: CycleData,
    profile: UserProfile
): Promise<AIPrediction> {
    if (!cycleData.lastPeriodStart || cycleData.entries.length < 1) {
        throw new Error('Not enough cycle data to generate prediction');
    }

    if (!OPENROUTER_API_KEY || !OPENROUTER_URL || !MODEL) {
        throw new Error('AI env vars not configured. Check .env file.');
    }

    console.log(`[AI] Calling ${MODEL} via ${OPENROUTER_URL}`);

    const response = await fetch(OPENROUTER_URL, {
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
                { role: 'system', content: buildSystemPrompt() },
                { role: 'user', content: buildUserMessage(cycleData, profile) },
            ],
            temperature: 0.3,
            max_tokens: 1500,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AI] API Error ${response.status}:`, errorText.substring(0, 200));
        throw new Error(`API error ${response.status}: ${errorText.substring(0, 150)}`);
    }

    const data = await response.json();

    // Try multiple paths to find content
    let content = data.choices?.[0]?.message?.content
        || data.choices?.[0]?.text
        || data.output
        || '';

    if (!content || content.trim().length === 0) {
        console.error('[AI] Raw Empty API Data:', JSON.stringify(data, null, 2));
        // Some models via openrouter/free might return empty content or fail to format JSON
        // Instead of breaking the whole app, throw a specific error we can catch
        throw new Error('API returned empty response for this model');
    }

    console.log('[AI] Response received, parsing...');
    const cleaned = cleanResponse(content);

    if (!cleaned || cleaned.length < 5) {
        throw new Error('Model returned empty content after cleaning');
    }

    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        console.error('[AI] JSON parse failed. Cleaned text:', cleaned.substring(0, 200));
        throw new Error('Invalid JSON from model');
    }

    if (!parsed.nextPeriodDate || parsed.predictedCycleLength === undefined) {
        throw new Error('Invalid prediction format — missing required fields');
    }

    let rawConfidence = parsed.confidence !== undefined ? parsed.confidence : 0.5;
    let mappedConfidence = rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence;

    const prediction: AIPrediction = {
        nextPeriodDate: parsed.nextPeriodDate,
        predictedCycleLength: parsed.predictedCycleLength,
        fertileWindowStart: parsed.fertileWindowStart || '',
        fertileWindowEnd: parsed.fertileWindowEnd || '',
        insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 5) : [],
        tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 4) : [],
        confidence: Math.round(Math.min(Math.max(mappedConfidence, 0), 100)),
        generatedAt: new Date().toISOString(),
        dataHash: generateDataHash(cycleData),
    };

    console.log('[AI] ✅ Prediction generated via', MODEL, '| Confidence:', prediction.confidence);
    return prediction;
}
