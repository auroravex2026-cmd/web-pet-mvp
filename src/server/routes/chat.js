const express = require("express");
const chatFunction = require("../../services/chat.service");
const personas = require("../../config/persona");

const router = express.Router();

router.post("/chat", async (req, res, next) => {
    const messages = req.body.messages;
    const persona = req.body.persona ?? "gentle";

    if (!Array.isArray(messages)) {
        return res.status(400).json({
            error: "messages must be an array"
        });
    }

    if (messages.length === 0) {
        return res.status(400).json({
            error: "messages is required"
        });
    }

    try {
        if (typeof persona !== "string" || !Object.hasOwn(personas, persona)) {
            return res.status(400).json({
            error: "unknown persona"
            });
        }

        const replyMessage = await chatFunction(messages,persona);

        res.json({
            reply: replyMessage
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
