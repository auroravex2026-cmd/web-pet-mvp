const express = require("express");
const { createChessMove, createChessChatReply } = require("../../services/chess-ai.service");

const router = express.Router();

function validateGameState(body) {
    const { board, turn, history = [] } = body;

    if (!Array.isArray(board) || board.length !== 8 || board.some((row) => typeof row !== "string" || row.length !== 8)) {
        return "board must contain eight rows of eight characters";
    }

    if (turn !== "w" && turn !== "b") {
        return "turn must be w or b";
    }

    if (!Array.isArray(history)) {
        return "history must be an array";
    }

    return null;
}

router.post("/chess/move", async (req, res, next) => {
    const { aiColor, legalMoves } = req.body;
    const error = validateGameState(req.body);

    if (error) {
        return res.status(400).json({ error });
    }

    if ((aiColor !== "w" && aiColor !== "b") || !Array.isArray(legalMoves) || legalMoves.length === 0 || legalMoves.length > 256 || legalMoves.some((move) => typeof move !== "string" || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move))) {
        return res.status(400).json({ error: "legalMoves must be a non-empty list of coordinate moves" });
    }

    try {
        const result = await createChessMove({ ...req.body, legalMoves: [...new Set(legalMoves)] });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.post("/chess/chat", async (req, res, next) => {
    const error = validateGameState(req.body);

    if (error) {
        return res.status(400).json({ error });
    }

    if (!Array.isArray(req.body.messages) || req.body.messages.length === 0) {
        return res.status(400).json({ error: "messages is required" });
    }

    try {
        const reply = await createChessChatReply(req.body);
        res.json({ reply });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
