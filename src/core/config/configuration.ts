export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '4096', 10),
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
    topK: parseInt(process.env.GEMINI_TOP_K || '40', 10),
    topP: parseFloat(process.env.GEMINI_TOP_P || '0.95'),
    defaultSystemInstruction:
      process.env.GEMINI_DEFAULT_SYSTEM_INSTRUCTION ||
      'You are a helpful customer support agent. Always be polite and concise.',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    ttl: parseInt(process.env.REDIS_TTL || String(60 * 60 * 24 * 7), 10), // 7 days
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true',
  },
  mcp: {
    command: process.env.MCP_COMMAND || 'npx',
    args: (
      process.env.MCP_ARGS ||
      'mcp-remote https://poc-docs-mcp-server.daohoangson.workers.dev/sse'
    ).split(' '),
    timeout: parseInt(process.env.MCP_TIMEOUT || '300000', 10),
  },
});
