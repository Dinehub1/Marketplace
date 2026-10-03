/**
 * @hermes/core - Unified AI Engine
 *
 * Provides typed access to:
 * 1. Jev Decision Model (TypeSafe on OpenRouter) - System One fast deterministic decisions
 *    - Choice: Select one option with probabilities & confidence
 *    - Noul: Probabilistic boolean (yes/no) verification
 *    - Score: Position on an ordered rubric scale
 *    Docs: https://openrouter.ai/docs/guides/community/jev
 *
 * 2. LLM Chat Completions (OpenRouter & DeepSeek)
 *    - OpenRouter (Multi-model: Gemini, DeepSeek, Claude, Llama)
 *    - DeepSeek (Direct or OpenRouter)
 */

export interface JevNoulQuestion {
  type: 'noul';
  instructions: string;
  criteria?: {
    true?: string;
    false?: string;
    [key: string]: string | undefined;
  };
}

export interface JevChoiceQuestion {
  type: 'choice';
  instructions: string;
  criteria: Record<string, string>;
}

export interface JevScoreQuestion {
  type: 'score';
  instructions: string;
  criteria: string[];
}

export type JevQuestion = JevNoulQuestion | JevChoiceQuestion | JevScoreQuestion;

export interface JevChoiceResult {
  type: 'choice';
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}

export interface JevNoulResult {
  type: 'noul';
  p_true?: number;
  noul?: number;
  decision?: boolean;
}

export interface JevScoreResult {
  type: 'score';
  score: number;
  level_probabilities: number[];
  confidence: number;
}

export type JevAnswer = JevChoiceResult | JevNoulResult | JevScoreResult;

export interface JevDecisionsResponse {
  id: string;
  model: string;
  decisions: Record<string, JevAnswer>;
  answers?: Record<string, any>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
    cost?: number;
  };
  provider?: string;
}

export interface JevDecisionsOptions {
  apiKey?: string;
  model?: string;
  decisionsUrl?: string;
}

/**
 * Execute a typed decision request using the TypeSafe Jev model on OpenRouter.
 */
export async function callJevDecisions(
  state: Record<string, unknown>,
  questions: Record<string, JevQuestion>,
  options: JevDecisionsOptions = {}
): Promise<JevDecisionsResponse> {
  const apiKey =
    options.apiKey ||
    (typeof process !== 'undefined'
      ? process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ||
        process.env.OPENROUTER_API_KEY ||
        process.env.EXPO_PUBLIC_AI_API_KEY
      : '');

  if (!apiKey) {
    throw new Error(
      '[Jev] Missing OpenRouter API key. Set OPENROUTER_API_KEY or EXPO_PUBLIC_OPENROUTER_API_KEY in .env.'
    );
  }

  const model =
    options.model ||
    (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_JEV_MODEL : '') ||
    'typesafe/jev-1.13';

  const url =
    options.decisionsUrl ||
    (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_JEV_DECISIONS_URL : '') ||
    'https://openrouter.ai/api/alpha/decisions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      state,
      questions,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[Jev] API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as any;
  if (!data.decisions && data.answers) {
    data.decisions = { ...data.answers };
  }
  if (!data.answers && data.decisions) {
    data.answers = { ...data.decisions };
  }
  return data as JevDecisionsResponse;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  provider?: 'openrouter' | 'deepseek';
  apiKey?: string;
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' | 'text' };
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call Chat Completions via OpenRouter or direct DeepSeek API.
 */
export async function callChatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const isDirectDeepSeek = options.provider === 'deepseek';

  let apiKey = options.apiKey;
  let baseUrl = '';
  let model = options.model;

  if (isDirectDeepSeek) {
    apiKey =
      apiKey ||
      (typeof process !== 'undefined'
        ? process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY
        : '');
    baseUrl =
      (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_DEEPSEEK_BASE_URL : '') ||
      'https://api.deepseek.com/v1';
    model = model || 'deepseek-chat';
  } else {
    // OpenRouter (supports DeepSeek via deepseek/deepseek-chat, Gemini, etc.)
    apiKey =
      apiKey ||
      (typeof process !== 'undefined'
        ? process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ||
          process.env.OPENROUTER_API_KEY ||
          process.env.EXPO_PUBLIC_AI_API_KEY
        : '');
    baseUrl =
      (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_AI_BASE_URL : '') ||
      'https://openrouter.ai/api/v1/chat/completions';
    model =
      model ||
      (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_AI_MODEL : '') ||
      'deepseek/deepseek-chat';
  }

  if (!apiKey) {
    throw new Error(
      `[AI] Missing API key for ${isDirectDeepSeek ? 'DeepSeek' : 'OpenRouter'}. Set it in root .env.`
    );
  }

  const endpoint = baseUrl.endsWith('/chat/completions')
    ? baseUrl
    : `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

  const body: Record<string, unknown> = {
    model,
    messages: options.messages,
    temperature: options.temperature ?? 0.2,
  };

  if (options.maxTokens) {
    body.max_tokens = options.maxTokens;
  }

  if (options.responseFormat) {
    body.response_format = options.responseFormat;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[AI] API error (${model}) ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  return {
    content: choice?.message?.content || '',
    model: data.model || model,
    usage: data.usage,
  };
}
