const getAIConfig = require("../config/env.js");

async function createChatCompletion(messages) {
    const { apiKey, baseUrl, model } = getAIConfig();

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: messages
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`upstream api error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (typeof reply !== "string" || reply.trim() === "") {
        throw new Error("model reply is empty");
    }

    return reply.trim();
}

module.exports = createChatCompletion;