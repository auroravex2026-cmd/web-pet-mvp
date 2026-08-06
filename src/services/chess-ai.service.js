const createChatCompletion = require("../ai/openai-compatible.client");

function boardToText(board) {
    if (!Array.isArray(board) || board.length !== 8 || board.some((row) => typeof row !== "string" || row.length !== 8)) {
        throw new Error("Board must contain eight rows of eight characters.");
    }

    return board
        .map((row, index) => `${8 - index}  ${row.replace(/\./g, "·").split("").join(" ")}`)
        .concat("   a b c d e f g h")
        .join("\n");
}

function pickMove(response, legalMoves) {
    let parsed;

    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
        parsed = null;
    }

    const requestedMove = typeof parsed?.move === "string"
        ? parsed.move
        : response.match(/\b[a-h][1-8]\s*[-–—]?\s*[a-h][1-8][qrbn]?\b/i)?.[0];
    const normalizedMove = requestedMove?.toLowerCase().replace(/[^a-h1-8qrbn]/g, "");
    const move = legalMoves.includes(normalizedMove) ? normalizedMove : legalMoves[0];
    const commentary = typeof parsed?.commentary === "string" && parsed.commentary.trim()
        ? parsed.commentary.trim()
        : response.trim();

    return {
        move,
        commentary: commentary || `我选择 ${move}。`
    };
}

async function createChessMove({ board, turn, aiColor, legalMoves, history }) {
    const boardText = boardToText(board);
    const colorName = aiColor === "w" ? "白棋" : "黑棋";
    const historyText = Array.isArray(history) && history.length > 0 ? history.slice(-12).join(", ") : "尚未走子";
    const prompt = [
        "你是 Lilia，一位友善、认真且简洁的国际象棋对手。",
        `你执${colorName}，当前轮到${turn === "w" ? "白棋" : "黑棋"}。`,
        "只能从给出的合法走法中选择一步，不要臆造走法。",
        "请只输出一个 JSON 对象，不要使用 Markdown：",
        '{"move":"e2e4","commentary":"简短说明这一步的想法，使用中文。"}',
        "棋盘（大写为白棋，小写为黑棋，· 为空格）：",
        boardText,
        `最近走法：${historyText}`,
        `可选合法走法：${legalMoves.join(", ")}`
    ].join("\n");

    const response = await createChatCompletion([
        { role: "system", content: "Follow the requested JSON format exactly." },
        { role: "user", content: prompt }
    ]);

    return pickMove(response, legalMoves);
}

async function createChessChatReply({ board, turn, history, messages }) {
    const boardText = boardToText(board);
    const conversation = Array.isArray(messages)
        ? messages.slice(-10).filter((message) => (
            message &&
            (message.role === "user" || message.role === "assistant") &&
            typeof message.content === "string"
        ))
        : [];
    const historyText = Array.isArray(history) && history.length > 0 ? history.slice(-12).join(", ") : "尚未走子";

    return createChatCompletion([
        {
            role: "system",
            content: "You are Lilia, a warm and concise Chinese-speaking chess companion. Explain the current chess position accurately. Do not claim to have made a move unless it appears in the supplied move history."
        },
        {
            role: "user",
            content: `当前轮到${turn === "w" ? "白棋" : "黑棋"}。\n最近走法：${historyText}\n棋盘（大写为白棋，小写为黑棋，· 为空格）：\n${boardText}`
        },
        ...conversation
    ]);
}

module.exports = {
    createChessMove,
    createChessChatReply
};
