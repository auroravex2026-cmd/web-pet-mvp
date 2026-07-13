const personas = require("../config/persona");
const createChatCompletion = require("../ai/openai-compatible.client");

async function createPetReply(messages, persona) {

    const systemPrompt = personas[persona] || personas.gentle;
    const messagesForModel = [
        {
            role: "system",
            content: systemPrompt,
        },
        ...messages
    ];

    const reply = await createChatCompletion(messagesForModel);

    return reply;
}

module.exports = createPetReply;
