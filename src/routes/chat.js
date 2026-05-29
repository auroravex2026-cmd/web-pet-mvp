const express = require("express");
const chatFunction = require("../services/chat.service");

const router = express.Router();

router.post("/chat", async (req, res, next) => {
    const messages = req.body.messages;

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
        const replyMessage = await chatFunction(messages);

        res.json({
            reply: replyMessage
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
