function getAIConfig() {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL;
    const model = process.env.OPENAI_MODEL;

    if (!apiKey || !baseUrl || !model) {
        throw new Error("Missing required environment variables for AI communication.");
    }

    return { apiKey, baseUrl, model };
}

module.exports = getAIConfig;