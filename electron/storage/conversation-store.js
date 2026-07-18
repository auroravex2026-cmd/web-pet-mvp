const fs = require("node:fs/promises");
const path = require("node:path");

function getConversationFilePath(userDataPath) {
    return path.join(userDataPath, "conversation.json");
}

async function loadConversation(userDataPath) {
    const conversationFilePath = getConversationFilePath(userDataPath);
    try {
        const fileContent = await fs.readFile(conversationFilePath, "utf8");

        const data = JSON.parse(fileContent);

        if (!data || !Array.isArray(data.messages)) {
            throw new Error("Conversation file has an invalid format.");
        }

        return data.messages;

    } catch (error) {
        if (error.code === "ENOENT") {
            return [];
        }
        throw error;
    }
}

async function saveConversation(userDataPath, messages) {
    const conversationFilePath = getConversationFilePath(userDataPath);

    await fs.mkdir(userDataPath, {
        recursive: true
    });

    const data = {
        version: 1,
        messages
    };

    await fs.writeFile(conversationFilePath, JSON.stringify(data, null, 2),"utf8");
}

module.exports = {
    loadConversation,
    saveConversation
};
