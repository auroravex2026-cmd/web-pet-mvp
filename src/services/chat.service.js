const personas = require("../config/persona");

async function chatFunction(messages, persona) {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL;
    const model = process.env.OPENAI_MODEL;
    const systemPrompt = personas[persona] || personas.gentle;

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                ...messages
            ]
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

module.exports = chatFunction;
