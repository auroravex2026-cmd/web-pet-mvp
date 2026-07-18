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

const messages = [];
const reminders = [];

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
