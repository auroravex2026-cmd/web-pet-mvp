const chatForm = document.querySelector("#chatForm");
const status = document.querySelector("#status");
const messageInput = document.querySelector("#messageInput");
const sendBtn = document.querySelector("#sendBtn");
const personaSelect = document.querySelector("#personaSelect");
const messagesContainer = document.querySelector("#messages");
const petState = document.querySelector("#petState");
const petAvatar = document.querySelector("#petAvatar");
const petDescription = document.querySelector("#petDescription");
const desktopInfo = document.querySelector("#desktopInfo");

const reminderModal = document.querySelector("#reminderModal");
const reminderForm = document.querySelector("#reminderForm");
const reminderContent = document.querySelector("#reminderContent");
const reminderFormStatus = document.querySelector("#reminderFormStatus");
const saveReminderBtn = document.querySelector("#saveReminderBtn");
const reminderPageList = document.querySelector("#reminderPageList");
const reminderCount = document.querySelector("#reminderCount");
const reminderFeedbacks = document.querySelectorAll(".reminder-feedback");
const openReminderButtons = document.querySelectorAll("[data-open-reminder-modal]");
const closeReminderButtons = document.querySelectorAll(
    "#closeReminderBtn, #cancelReminderBtn, [data-close-reminder-modal]"
);
const navigationButtons = document.querySelectorAll("[data-view]");
const pageLinks = document.querySelectorAll("[data-go-to]");
const pages = document.querySelectorAll("[data-page]");
const pageContainer = document.querySelector(".page-container");

const chessBoard = document.querySelector("#chessBoard");
const chessStatus = document.querySelector("#chessStatus");
const chessColorSelect = document.querySelector("#chessColorSelect");
const newChessGameBtn = document.querySelector("#newChessGameBtn");
const undoChessBtn = document.querySelector("#undoChessBtn");
const chessTurnIndicator = document.querySelector("#chessTurnIndicator");
const chessMoveCount = document.querySelector("#chessMoveCount");
const chessAnalysis = document.querySelector("#chessAnalysis");
const chessAiBadge = document.querySelector("#chessAiBadge");
const chessChatMessages = document.querySelector("#chessChatMessages");
const chessChatForm = document.querySelector("#chessChatForm");
const chessChatInput = document.querySelector("#chessChatInput");
const chessChatSendBtn = document.querySelector("#chessChatSendBtn");

const messages = [];
const reminders = [];
const chessConversation = [];

const PET_IMAGE_BASE = "images/pet/mansui";
const SLEEP_DELAY_MS = 30000;
const HAPPY_RETURN_MS = 2500;

const petStates = {
    idle: {
        label: "idle",
        image: `${PET_IMAGE_BASE}/pet-idle.png`,
        description: "Lilia is quietly staying by your side."
    },
    thinking: {
        label: "thinking",
        image: `${PET_IMAGE_BASE}/pet-thinking.png`,
        description: "Lilia is thinking about what to say."
    },
    happy: {
        label: "happy",
        image: `${PET_IMAGE_BASE}/pet-happy.png`,
        description: "Lilia looks happy to talk with you."
    },
    sleepy: {
        label: "sleepy",
        image: `${PET_IMAGE_BASE}/pet-sleepy.png`,
        description: "Lilia is getting sleepy while waiting."
    }
};

let currentState = "idle";
let sleepTimer = null;
let returnTimer = null;
let isRequestPending = false;
let lastFocusedElement = null;

function renderMessages() {
    messagesContainer.innerHTML = "";

    for (const message of messages) {
        const item = document.createElement("div");
        item.textContent = `${message.role}: ${message.content}`;
        messagesContainer.appendChild(item);
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function renderReminderList(container, items, emptyMessageText) {
    container.innerHTML = "";

    if (items.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.className = "reminder-empty";
        emptyMessage.textContent = emptyMessageText;
        container.appendChild(emptyMessage);
        return;
    }

    for (const reminder of items) {
        const item = document.createElement("li");
        item.className = "reminder-item";
        item.textContent = reminder.content;
        container.appendChild(item);
    }
}

function renderActiveReminders() {
    renderReminderList(
        reminderPageList,
        reminders,
        "还没有活跃备忘录。"
    );
    reminderCount.textContent = `${reminders.length} 条`;
}

function setReminderFeedback(message) {
    for (const feedback of reminderFeedbacks) {
        feedback.textContent = message;
    }
}

function showPage(pageName) {
    const targetPage = document.querySelector(`[data-page="${pageName}"]`);

    if (!targetPage) {
        console.warn(`Unknown page: ${pageName}`);
        return;
    }

    for (const page of pages) {
        const isCurrentPage = page === targetPage;
        page.hidden = !isCurrentPage;
        page.classList.toggle("is-active", isCurrentPage);
    }

    for (const button of navigationButtons) {
        const isCurrentPage = button.dataset.view === pageName;
        button.classList.toggle("is-active", isCurrentPage);

        if (isCurrentPage) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    }

    pageContainer.scrollTop = 0;
}

function hasReminderApi() {
    return Boolean(
        window.desktop &&
        typeof window.desktop.createReminder === "function" &&
        typeof window.desktop.listActiveReminders === "function"
    );
}

function scheduleSleepTimer() {
    if (isRequestPending) {
        return;
    }

    if (sleepTimer) {
        clearTimeout(sleepTimer);
    }

    sleepTimer = setTimeout(() => {
        setPetState("sleepy", {
            statusText: "Lilia is getting sleepy."
        });
    }, SLEEP_DELAY_MS);
}

function setPetState(state, options = {}) {
    const { statusText, autoReturnMs, returnTo = "idle" } = options;
    const config = petStates[state];

    if (!config) {
        console.warn(`Unknown pet state: ${state}`);
        return;
    }

    currentState = state;

    if (returnTimer) {
        clearTimeout(returnTimer);
        returnTimer = null;
    }

    if (petState) {
        petState.textContent = config.label;
    }

    if (petAvatar) {
        petAvatar.src = config.image;
        petAvatar.alt = `Lilia ${config.label}`;
        petAvatar.dataset.state = state;
    }

    if (petDescription) {
        petDescription.textContent = config.description;
    }
    document.body.dataset.petState = state;

    if (typeof statusText === "string") {
        status.textContent = statusText;
    }

    if (typeof autoReturnMs === "number" && autoReturnMs > 0) {
        returnTimer = setTimeout(() => {
            setPetState(returnTo);
        }, autoReturnMs);
    }

    scheduleSleepTimer();
}

function wakePet() {
    if (isRequestPending) {
        return;
    }

    if (currentState === "sleepy") {
        setPetState("idle", { statusText: "Lilia woke up." });
        return;
    }

    scheduleSleepTimer();
}

function openReminderModal() {
    lastFocusedElement = document.activeElement;
    reminderForm.reset();
    reminderFormStatus.textContent = "";
    reminderFormStatus.classList.remove("is-error");
    reminderModal.classList.add("is-open");
    reminderModal.setAttribute("aria-hidden", "false");
    reminderContent.focus();
}

function closeReminderModal() {
    reminderModal.classList.remove("is-open");
    reminderModal.setAttribute("aria-hidden", "true");

    if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
    }
}

async function loadActiveReminders() {
    if (!hasReminderApi()) {
        setReminderFeedback("备忘录只能在桌面版 Lilia 中使用。");
        renderActiveReminders();
        return;
    }

    try {
        const savedReminders = await window.desktop.listActiveReminders();
        reminders.splice(0, reminders.length, ...savedReminders);
        renderActiveReminders();
    } catch (error) {
        console.error("Failed to load reminders:", error);
        setReminderFeedback("暂时无法读取备忘录。");
    }
}

async function renderDesktopInfo() {
    if (!window.desktop) {
        return;
    }

    const appVersion = await window.desktop.getAppVersion();
    const { electron, node } = await window.desktop.getRuntimeVersions();

    desktopInfo.textContent = `Web Pet ${appVersion} and Desktop app running on Electron ${electron} and Node.js ${node}`;
}

async function loadSavedConversation() {
    if (!window.desktop) {
        return;
    }

    try {
        const savedMessages = await window.desktop.loadConversation();
        messages.push(...savedMessages);
        renderMessages();

        if (savedMessages.length > 0) {
            status.textContent = "Previous conversation restored.";
        }
    } catch (error) {
        console.error("Failed to restore conversation:", error);
    }
}

async function saveCurrentConversation() {
    if (!window.desktop) {
        return;
    }

    try {
        await window.desktop.saveConversation(messages);
    } catch (error) {
        console.error("Could not save conversation:", error);
    }
}

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = messageInput.value.trim();
    const persona = personaSelect.value;

    if (message === "") {
        status.textContent = "Please type something.";
        return;
    }

    const previousLength = messages.length;
    messages.push({ role: "user", content: message });
    renderMessages();

    isRequestPending = true;
    sendBtn.disabled = true;
    sendBtn.textContent = "sending...";
    personaSelect.disabled = true;
    messageInput.value = "";
    setPetState("thinking", { statusText: "loading..." });

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ persona, messages })
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        messages.push({ role: "assistant", content: data.reply });
        renderMessages();
        await saveCurrentConversation();

        setPetState("happy", {
            statusText: "reply received",
            autoReturnMs: HAPPY_RETURN_MS,
            returnTo: "idle"
        });
    } catch (error) {
        console.error(error);
        messages.length = previousLength;
        renderMessages();
        setPetState("idle", { statusText: "request failed" });
    } finally {
        isRequestPending = false;
        sendBtn.disabled = false;
        sendBtn.textContent = "send";
        personaSelect.disabled = false;
        scheduleSleepTimer();
    }
});

reminderForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const content = reminderContent.value.trim();

    if (content === "") {
        reminderFormStatus.textContent = "请先写下你想记住的事情。";
        reminderFormStatus.classList.add("is-error");
        return;
    }

    if (!hasReminderApi()) {
        reminderFormStatus.textContent = "请在 Electron 桌面版中保存备忘录。";
        reminderFormStatus.classList.add("is-error");
        return;
    }

    saveReminderBtn.disabled = true;
    saveReminderBtn.textContent = "保存中...";
    reminderFormStatus.textContent = "";
    reminderFormStatus.classList.remove("is-error");

    try {
        await window.desktop.createReminder({ content });
        await loadActiveReminders();
        setReminderFeedback("好的，我已经帮你记下来了。");
        closeReminderModal();
    } catch (error) {
        console.error("Failed to create reminder:", error);
        reminderFormStatus.textContent = "保存失败，请稍后再试。";
        reminderFormStatus.classList.add("is-error");
    } finally {
        saveReminderBtn.disabled = false;
        saveReminderBtn.textContent = "帮我记住";
    }
});

for (const button of openReminderButtons) {
    button.addEventListener("click", openReminderModal);
}

for (const button of closeReminderButtons) {
    button.addEventListener("click", closeReminderModal);
}

for (const button of navigationButtons) {
    button.addEventListener("click", () => {
        showPage(button.dataset.view);
    });
}

for (const link of pageLinks) {
    link.addEventListener("click", () => {
        showPage(link.dataset.goTo);
    });
}

if (petAvatar) {
    petAvatar.addEventListener("click", () => {
        if (isRequestPending) {
            return;
        }

        setPetState("happy", {
            statusText: "Lilia noticed your click.",
            autoReturnMs: 1500,
            returnTo: "idle"
        });
    });
}

messageInput.addEventListener("focus", wakePet);
messageInput.addEventListener("input", scheduleSleepTimer);
window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && reminderModal.classList.contains("is-open")) {
        closeReminderModal();
        return;
    }

    wakePet();
});

showPage("home");
setPetState("idle", { statusText: "Say something to your pet." });
renderActiveReminders();
loadSavedConversation();
renderDesktopInfo();
loadActiveReminders();

// Chess is intentionally kept dependency-free so the desktop app can play locally
// while using the existing model connection only for the opponent's choice and commentary.
const CHESS_SYMBOLS = {
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟"
};
const CHESS_FILES = "abcdefgh";
const CHESS_INITIAL_BOARD = [
    "rnbqkbnr",
    "pppppppp",
    "........",
    "........",
    "........",
    "........",
    "PPPPPPPP",
    "RNBQKBNR"
];

let chessGame = createChessGame("w");

function createChessGame(userColor) {
    return {
        board: CHESS_INITIAL_BOARD.map((row) => row.split("")),
        turn: "w",
        userColor,
        castling: { w: { k: true, q: true }, b: { k: true, q: true } },
        enPassant: null,
        history: [],
        snapshots: [],
        selected: null,
        lastMove: null,
        gameOver: false,
        aiThinking: false
    };
}

function chessColorOf(piece) {
    if (!piece || piece === ".") return null;
    return piece === piece.toUpperCase() ? "w" : "b";
}

function chessOpponent(color) {
    return color === "w" ? "b" : "w";
}

function chessInBounds(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function chessSquareName(row, col) {
    return `${CHESS_FILES[col]}${8 - row}`;
}

function chessMoveToUci(move) {
    return `${chessSquareName(move.from.row, move.from.col)}${chessSquareName(move.to.row, move.to.col)}${move.promotion || ""}`;
}

function chessMoveLabel(move) {
    return `${chessSquareName(move.from.row, move.from.col)} → ${chessSquareName(move.to.row, move.to.col)}${move.promotion ? `=${move.promotion.toUpperCase()}` : ""}`;
}

function chessCloneState(state) {
    return {
        ...state,
        board: state.board.map((row) => [...row]),
        castling: {
            w: { ...state.castling.w },
            b: { ...state.castling.b }
        },
        history: [...state.history],
        snapshots: [],
        selected: null,
        lastMove: state.lastMove ? {
            from: { ...state.lastMove.from },
            to: { ...state.lastMove.to }
        } : null
    };
}

function chessSnapshot(state) {
    return {
        board: state.board.map((row) => [...row]),
        turn: state.turn,
        castling: { w: { ...state.castling.w }, b: { ...state.castling.b } },
        enPassant: state.enPassant ? { ...state.enPassant } : null,
        history: [...state.history],
        lastMove: state.lastMove ? { from: { ...state.lastMove.from }, to: { ...state.lastMove.to } } : null,
        gameOver: state.gameOver
    };
}

function restoreChessSnapshot(snapshot) {
    chessGame.board = snapshot.board.map((row) => [...row]);
    chessGame.turn = snapshot.turn;
    chessGame.castling = { w: { ...snapshot.castling.w }, b: { ...snapshot.castling.b } };
    chessGame.enPassant = snapshot.enPassant ? { ...snapshot.enPassant } : null;
    chessGame.history = [...snapshot.history];
    chessGame.lastMove = snapshot.lastMove ? { from: { ...snapshot.lastMove.from }, to: { ...snapshot.lastMove.to } } : null;
    chessGame.gameOver = snapshot.gameOver;
    chessGame.selected = null;
}

function chessIsSquareAttacked(board, row, col, byColor) {
    const pawn = byColor === "w" ? "P" : "p";
    const pawnRow = row + (byColor === "w" ? 1 : -1);
    for (const pawnCol of [col - 1, col + 1]) {
        if (chessInBounds(pawnRow, pawnCol) && board[pawnRow][pawnCol] === pawn) return true;
    }

    const knight = byColor === "w" ? "N" : "n";
    for (const [rowDelta, colDelta] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
        const nextRow = row + rowDelta;
        const nextCol = col + colDelta;
        if (chessInBounds(nextRow, nextCol) && board[nextRow][nextCol] === knight) return true;
    }

    const king = byColor === "w" ? "K" : "k";
    for (let rowDelta = -1; rowDelta <= 1; rowDelta += 1) {
        for (let colDelta = -1; colDelta <= 1; colDelta += 1) {
            if (!rowDelta && !colDelta) continue;
            const nextRow = row + rowDelta;
            const nextCol = col + colDelta;
            if (chessInBounds(nextRow, nextCol) && board[nextRow][nextCol] === king) return true;
        }
    }

    const lineAttacks = [
        { directions: [[-1, 0], [1, 0], [0, -1], [0, 1]], pieces: byColor === "w" ? ["R", "Q"] : ["r", "q"] },
        { directions: [[-1, -1], [-1, 1], [1, -1], [1, 1]], pieces: byColor === "w" ? ["B", "Q"] : ["b", "q"] }
    ];
    for (const line of lineAttacks) {
        for (const [rowDelta, colDelta] of line.directions) {
            let nextRow = row + rowDelta;
            let nextCol = col + colDelta;
            while (chessInBounds(nextRow, nextCol)) {
                const piece = board[nextRow][nextCol];
                if (piece !== ".") {
                    if (line.pieces.includes(piece)) return true;
                    break;
                }
                nextRow += rowDelta;
                nextCol += colDelta;
            }
        }
    }

    return false;
}

function chessKingInCheck(state, color) {
    const king = color === "w" ? "K" : "k";
    for (let row = 0; row < 8; row += 1) {
        for (let col = 0; col < 8; col += 1) {
            if (state.board[row][col] === king) {
                return chessIsSquareAttacked(state.board, row, col, chessOpponent(color));
            }
        }
    }
    return true;
}

function chessAddPawnMove(moves, from, to, piece, extra = {}) {
    const promotionRow = chessColorOf(piece) === "w" ? 0 : 7;
    if (to.row === promotionRow) {
        for (const promotion of ["q", "r", "b", "n"]) moves.push({ from, to, promotion, ...extra });
    } else {
        moves.push({ from, to, ...extra });
    }
}

function chessPseudoMoves(state, color) {
    const moves = [];
    const enemy = chessOpponent(color);
    for (let row = 0; row < 8; row += 1) {
        for (let col = 0; col < 8; col += 1) {
            const piece = state.board[row][col];
            if (chessColorOf(piece) !== color) continue;
            const from = { row, col };
            const type = piece.toUpperCase();

            if (type === "P") {
                const direction = color === "w" ? -1 : 1;
                const startRow = color === "w" ? 6 : 1;
                const oneRow = row + direction;
                if (chessInBounds(oneRow, col) && state.board[oneRow][col] === ".") {
                    chessAddPawnMove(moves, from, { row: oneRow, col }, piece);
                    const twoRow = row + direction * 2;
                    if (row === startRow && state.board[twoRow][col] === ".") moves.push({ from, to: { row: twoRow, col } });
                }
                for (const captureCol of [col - 1, col + 1]) {
                    if (!chessInBounds(oneRow, captureCol)) continue;
                    const target = state.board[oneRow][captureCol];
                    if (target !== "." && chessColorOf(target) === enemy && target.toUpperCase() !== "K") {
                        chessAddPawnMove(moves, from, { row: oneRow, col: captureCol }, piece);
                    }
                    if (state.enPassant && state.enPassant.row === oneRow && state.enPassant.col === captureCol) {
                        moves.push({ from, to: { row: oneRow, col: captureCol }, enPassant: true });
                    }
                }
                continue;
            }

            if (type === "N") {
                for (const [rowDelta, colDelta] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
                    const nextRow = row + rowDelta;
                    const nextCol = col + colDelta;
                    if (chessInBounds(nextRow, nextCol) && (state.board[nextRow][nextCol] === "." || chessColorOf(state.board[nextRow][nextCol]) === enemy) && state.board[nextRow][nextCol].toUpperCase() !== "K") {
                        moves.push({ from, to: { row: nextRow, col: nextCol } });
                    }
                }
                continue;
            }

            if (type === "K") {
                for (let rowDelta = -1; rowDelta <= 1; rowDelta += 1) {
                    for (let colDelta = -1; colDelta <= 1; colDelta += 1) {
                        if (!rowDelta && !colDelta) continue;
                        const nextRow = row + rowDelta;
                        const nextCol = col + colDelta;
                        if (chessInBounds(nextRow, nextCol) && (state.board[nextRow][nextCol] === "." || chessColorOf(state.board[nextRow][nextCol]) === enemy) && state.board[nextRow][nextCol].toUpperCase() !== "K") {
                            moves.push({ from, to: { row: nextRow, col: nextCol } });
                        }
                    }
                }
                const homeRow = color === "w" ? 7 : 0;
                if (row === homeRow && col === 4 && !chessKingInCheck(state, color)) {
                    if (state.castling[color].k && state.board[homeRow][5] === "." && state.board[homeRow][6] === "." && state.board[homeRow][7].toUpperCase() === "R" && chessColorOf(state.board[homeRow][7]) === color && !chessIsSquareAttacked(state.board, homeRow, 5, enemy) && !chessIsSquareAttacked(state.board, homeRow, 6, enemy)) {
                        moves.push({ from, to: { row: homeRow, col: 6 }, castle: "k" });
                    }
                    if (state.castling[color].q && state.board[homeRow][1] === "." && state.board[homeRow][2] === "." && state.board[homeRow][3] === "." && state.board[homeRow][0].toUpperCase() === "R" && chessColorOf(state.board[homeRow][0]) === color && !chessIsSquareAttacked(state.board, homeRow, 3, enemy) && !chessIsSquareAttacked(state.board, homeRow, 2, enemy)) {
                        moves.push({ from, to: { row: homeRow, col: 2 }, castle: "q" });
                    }
                }
                continue;
            }

            const directions = type === "B"
                ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
                : type === "R"
                    ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
                    : [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [rowDelta, colDelta] of directions) {
                let nextRow = row + rowDelta;
                let nextCol = col + colDelta;
                while (chessInBounds(nextRow, nextCol)) {
                    const target = state.board[nextRow][nextCol];
                    if (target === ".") {
                        moves.push({ from, to: { row: nextRow, col: nextCol } });
                    } else {
                        if (chessColorOf(target) === enemy && target.toUpperCase() !== "K") moves.push({ from, to: { row: nextRow, col: nextCol } });
                        break;
                    }
                    nextRow += rowDelta;
                    nextCol += colDelta;
                }
            }
        }
    }
    return moves;
}

function chessApplyRaw(state, move) {
    const piece = state.board[move.from.row][move.from.col];
    const color = chessColorOf(piece);
    const enemy = chessOpponent(color);
    const captured = state.board[move.to.row][move.to.col];
    state.board[move.from.row][move.from.col] = ".";

    if (move.enPassant) state.board[move.to.row + (color === "w" ? 1 : -1)][move.to.col] = ".";
    if (move.castle === "k") {
        state.board[move.to.row][5] = state.board[move.to.row][7];
        state.board[move.to.row][7] = ".";
    }
    if (move.castle === "q") {
        state.board[move.to.row][3] = state.board[move.to.row][0];
        state.board[move.to.row][0] = ".";
    }

    let placedPiece = piece;
    if (move.promotion) placedPiece = color === "w" ? move.promotion.toUpperCase() : move.promotion.toLowerCase();
    state.board[move.to.row][move.to.col] = placedPiece;

    if (piece.toUpperCase() === "K") state.castling[color] = { k: false, q: false };
    if (piece.toUpperCase() === "R") {
        if (move.from.col === 0) state.castling[color].q = false;
        if (move.from.col === 7) state.castling[color].k = false;
    }
    if (captured && captured.toUpperCase() === "R") {
        if (move.to.row === (enemy === "w" ? 7 : 0) && move.to.col === 0) state.castling[enemy].q = false;
        if (move.to.row === (enemy === "w" ? 7 : 0) && move.to.col === 7) state.castling[enemy].k = false;
    }

    state.enPassant = null;
    if (piece.toUpperCase() === "P" && Math.abs(move.to.row - move.from.row) === 2) {
        state.enPassant = { row: (move.to.row + move.from.row) / 2, col: move.from.col };
    }
    state.turn = enemy;
}

function chessLegalMoves(state, color = state.turn) {
    return chessPseudoMoves(state, color).filter((move) => {
        const simulation = chessCloneState(state);
        chessApplyRaw(simulation, move);
        return !chessKingInCheck(simulation, color);
    });
}

function chessFormatHistory(move, piece) {
    const prefix = piece.toUpperCase() === "P" ? "" : piece.toUpperCase();
    const capture = chessGame.board[move.to.row][move.to.col] !== "." || move.enPassant ? "x" : "-";
    return `${prefix}${chessSquareName(move.from.row, move.from.col)}${capture}${chessSquareName(move.to.row, move.to.col)}${move.promotion ? `=${move.promotion.toUpperCase()}` : ""}`;
}

function chessPerformMove(move) {
    const piece = chessGame.board[move.from.row][move.from.col];
    chessGame.snapshots.push(chessSnapshot(chessGame));
    chessGame.history.push(chessFormatHistory(move, piece));
    chessApplyRaw(chessGame, move);
    chessGame.lastMove = { from: { ...move.from }, to: { ...move.to } };
    chessGame.selected = null;
    chessGame.gameOver = false;
    chessRender();
}

function chessCurrentStatus() {
    const moves = chessLegalMoves(chessGame, chessGame.turn);
    if (moves.length === 0) {
        chessGame.gameOver = true;
        if (chessKingInCheck(chessGame, chessGame.turn)) return `将军！${chessGame.turn === "w" ? "白棋" : "黑棋"}被将死。`;
        return "和棋：当前局面无合法走法。";
    }
    if (chessKingInCheck(chessGame, chessGame.turn)) return `${chessGame.turn === "w" ? "白棋" : "黑棋"}正在被将军。`;
    return `轮到${chessGame.turn === "w" ? "白棋" : "黑棋"}走棋`;
}

function chessRender() {
    if (!chessBoard) return;
    const legalMoves = chessGame.selected ? chessLegalMoves(chessGame, chessGame.turn).filter((move) => move.from.row === chessGame.selected.row && move.from.col === chessGame.selected.col) : [];
    const legalTargets = new Map(legalMoves.map((move) => [`${move.to.row}:${move.to.col}`, move]));
    chessBoard.innerHTML = "";

    for (let displayRow = 0; displayRow < 8; displayRow += 1) {
        for (let displayCol = 0; displayCol < 8; displayCol += 1) {
            const row = chessGame.userColor === "w" ? displayRow : 7 - displayRow;
            const col = chessGame.userColor === "w" ? displayCol : 7 - displayCol;
            const piece = chessGame.board[row][col];
            const square = document.createElement("button");
            const key = `${row}:${col}`;
            square.type = "button";
            square.className = `chess-square ${(row + col) % 2 === 0 ? "light" : "dark"}`;
            square.dataset.row = row;
            square.dataset.col = col;
            square.setAttribute("role", "gridcell");
            square.setAttribute("aria-label", `${chessSquareName(row, col)}${piece === "." ? " 空格" : ` ${piece}`}`);
            if (chessGame.selected?.row === row && chessGame.selected?.col === col) square.classList.add("is-selected");
            if (chessGame.lastMove && ((chessGame.lastMove.from.row === row && chessGame.lastMove.from.col === col) || (chessGame.lastMove.to.row === row && chessGame.lastMove.to.col === col))) square.classList.add("is-last-move");
            if (legalTargets.has(key)) square.classList.add(chessGame.board[row][col] === "." ? "is-legal" : "is-capture");
            if (piece !== ".") {
                const pieceElement = document.createElement("span");
                pieceElement.className = `chess-piece ${chessColorOf(piece) === "w" ? "white" : "black"}`;
                pieceElement.textContent = CHESS_SYMBOLS[piece];
                square.appendChild(pieceElement);
            }
            square.addEventListener("click", () => chessSelectSquare(row, col));
            chessBoard.appendChild(square);
        }
    }

    const statusText = chessCurrentStatus();
    chessStatus.textContent = chessGame.aiThinking ? "Lilia 正在思考这一步……" : statusText;
    chessTurnIndicator.textContent = chessGame.aiThinking ? "Lilia 思考中" : `轮到${chessGame.turn === "w" ? "白棋" : "黑棋"}`;
    chessMoveCount.textContent = `第 ${Math.floor(chessGame.history.length / 2) + 1} 回合`;
    undoChessBtn.disabled = chessGame.aiThinking || chessGame.snapshots.length === 0;
}

function chessSelectSquare(row, col) {
    if (chessGame.aiThinking || chessGame.gameOver || chessGame.turn !== chessGame.userColor) return;
    const piece = chessGame.board[row][col];
    const selectedMoves = chessGame.selected ? chessLegalMoves(chessGame, chessGame.turn).filter((move) => move.from.row === chessGame.selected.row && move.from.col === chessGame.selected.col) : [];
    const targetMove = selectedMoves.find((move) => move.to.row === row && move.to.col === col);
    if (targetMove) {
        chessPerformMove(targetMove);
        chessSetAnalysis(`你走了 ${chessMoveLabel(targetMove)}。轮到 Lilia 了。`);
        if (!chessGame.gameOver) chessRequestAiMove();
        return;
    }
    if (chessColorOf(piece) === chessGame.userColor) {
        chessGame.selected = { row, col };
    } else {
        chessGame.selected = null;
    }
    chessRender();
}

function chessSetAnalysis(text, loading = false) {
    chessAnalysis.textContent = text;
    chessAnalysis.classList.toggle("is-loading", loading);
}

function chessBoardPayload() {
    return chessGame.board.map((row) => row.join(""));
}

async function chessRequestAiMove() {
    const aiColor = chessOpponent(chessGame.userColor);
    if (chessGame.turn !== aiColor || chessGame.gameOver || chessGame.aiThinking) return;
    const legalMoves = chessLegalMoves(chessGame, aiColor);
    if (legalMoves.length === 0) {
        chessRender();
        return;
    }

    chessGame.aiThinking = true;
    chessAiBadge.textContent = "思考中";
    chessSetAnalysis("我正在看看棋盘……", true);
    chessRender();

    try {
        const response = await fetch("/api/chess/move", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                board: chessBoardPayload(),
                turn: chessGame.turn,
                aiColor,
                history: chessGame.history,
                legalMoves: legalMoves.map(chessMoveToUci)
            })
        });
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        const aiMove = legalMoves.find((move) => chessMoveToUci(move) === String(data.move || "").toLowerCase());
        const moveToPlay = aiMove || legalMoves[0];
        chessPerformMove(moveToPlay);
        chessAiBadge.textContent = "已落子";
        chessSetAnalysis(`${data.commentary || "我已经走好了。"}\n\n我的走法：${chessMoveLabel(moveToPlay)}`);
    } catch (error) {
        console.error("Failed to request chess move:", error);
        const fallback = legalMoves[0];
        chessPerformMove(fallback);
        chessAiBadge.textContent = "离线应对";
        chessSetAnalysis(`暂时连接不到大模型，我先走了一步合法棋：${chessMoveLabel(fallback)}。`);
    } finally {
        chessGame.aiThinking = false;
        chessRender();
    }
}

function chessRenderConversation() {
    chessChatMessages.innerHTML = "";
    for (const message of chessConversation) {
        const item = document.createElement("div");
        item.className = `chess-chat-message ${message.role}`;
        item.textContent = message.content;
        chessChatMessages.appendChild(item);
    }
    chessChatMessages.scrollTop = chessChatMessages.scrollHeight;
}

async function chessSendChat(event) {
    event.preventDefault();
    const content = chessChatInput.value.trim();
    if (!content || chessGame.aiThinking) return;

    chessConversation.push({ role: "user", content });
    chessRenderConversation();
    chessChatInput.value = "";
    chessChatSendBtn.disabled = true;

    try {
        const response = await fetch("/api/chess/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                board: chessBoardPayload(),
                turn: chessGame.turn,
                history: chessGame.history,
                messages: chessConversation
            })
        });
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        chessConversation.push({ role: "assistant", content: data.reply });
    } catch (error) {
        console.error("Failed to request chess chat:", error);
        chessConversation.push({ role: "assistant", content: "我暂时没连上大模型，但棋盘状态还在，我们可以继续下。" });
    } finally {
        chessChatSendBtn.disabled = false;
        chessRenderConversation();
        chessChatInput.focus();
    }
}

function chessUndo() {
    if (chessGame.aiThinking || chessGame.snapshots.length === 0) return;
    const steps = chessGame.turn === chessGame.userColor && chessGame.snapshots.length >= 2 ? 2 : 1;
    const snapshot = chessGame.snapshots[Math.max(0, chessGame.snapshots.length - steps)];
    chessGame.snapshots.splice(Math.max(0, chessGame.snapshots.length - steps), steps);
    restoreChessSnapshot(snapshot);
    chessAiBadge.textContent = "待命";
    chessSetAnalysis("已悔棋。轮到你了。", false);
    chessRender();
}

function chessStartNewGame() {
    chessGame = createChessGame(chessColorSelect.value);
    chessAiBadge.textContent = "待命";
    chessSetAnalysis(chessGame.userColor === "w" ? "你执白，先走吧。" : "你执黑，我先来。", false);
    chessRender();
    if (chessGame.userColor === "b") chessRequestAiMove();
}

newChessGameBtn.addEventListener("click", chessStartNewGame);
undoChessBtn.addEventListener("click", chessUndo);
chessColorSelect.addEventListener("change", chessStartNewGame);
chessChatForm.addEventListener("submit", chessSendChat);
chessRenderConversation();
chessRender();
