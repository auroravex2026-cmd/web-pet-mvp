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

const messages = [];

const PET_IMAGE_BASE = "images/pet/mansui";
const SLEEP_DELAY_MS = 30000;
const HAPPY_RETURN_MS = 2500;

const petStates = {
    idle: {
        label: "idle",
        image: `${PET_IMAGE_BASE}/pet-idle.png`,
        description: "Momo is quietly staying by your side."
    },
    thinking: {
        label: "thinking",
        image: `${PET_IMAGE_BASE}/pet-thinking.png`,
        description: "Momo is thinking about what to say."
    },
    happy: {
        label: "happy",
        image: `${PET_IMAGE_BASE}/pet-happy.png`,
        description: "Momo looks happy to talk with you."
    },
    sleepy: {
        label: "sleepy",
        image: `${PET_IMAGE_BASE}/pet-sleepy.png`,
        description: "Momo is getting sleepy while waiting."
    }
  };

let currentState = "idle";
let sleepTimer = null;
let returnTimer = null;
let isRequestPending = false;

function renderMessages() {
    messagesContainer.innerHTML = "";

    for (const message of messages) {
        const item = document.createElement("div");
        item.textContent = `${message.role}:
        ${message.content}`;
         messagesContainer.appendChild(item);
    }

    messagesContainer.scrollTop =messagesContainer.scrollHeight;
}

function clearStateTimers() {
    if (sleepTimer) {
        clearTimeout(sleepTimer);
        sleepTimer = null;
    }

    if (returnTimer) {
        clearTimeout(returnTimer);
        returnTimer = null;
    }
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
            statusText: "Momo is getting sleepy."
        });
    }, SLEEP_DELAY_MS);
}

function setPetState(state, options = {}) {
    const {
        statusText,
        autoReturnMs,
        returnTo = "idle"
    } = options;

    const config = petStates[state];

    if (!config) {
        console.warn(`Unknown pet state:${state}`);
        return;
    }

    currentState = state;

    if (returnTimer) {
        clearTimeout(returnTimer);
        returnTimer = null;
    }

    petState.textContent = config.label;
    petAvatar.src = config.image;
    petAvatar.alt = `Momo ${config.label}`;
    petAvatar.dataset.state = state;

    if (petDescription) {
        petDescription.textContent =
        config.description;
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
        setPetState("idle", {
            statusText: "Momo woke up."
        });
        return;
    }

    scheduleSleepTimer();
}


async function renderDesktopInfo() {
    if (!desktopInfo || !window.desktop) {
        return;
    }

    const appVersion = await window.desktop.getAppVersion();
    const { electron, node } = await window.desktop.getRuntimeVersions();

    desktopInfo.textContent = `Web Pet ${appVersion} and Desktop app running on Electron ${electron} and Node.js ${node}`;
}


chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = messageInput.value.trim();
    const persona = personaSelect.value;

    if (message === "") {
        status.textContent = "please type something";
        return;
    }

    const previousLength = messages.length;

    messages.push({
        role: "user",
        content: message
    });

    renderMessages();

    isRequestPending = true;

    sendBtn.disabled = true;
    sendBtn.textContent = "sending...";
    personaSelect.disabled = true;
    messageInput.value = "";

    setPetState("thinking", {
        statusText: "loading..."
    });

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
                persona: persona,
                messages: messages
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error${response.status}`);
        }

        const data = await response.json();

        messages.push({
            role: "assistant",
            content: data.reply
        });

        renderMessages();

        setPetState("happy", {
            statusText: "reply received",
            autoReturnMs: HAPPY_RETURN_MS,
            returnTo: "idle"
        });
    } catch (error) {
        console.error(error);
        messages.length = previousLength;
        renderMessages();

        setPetState("idle", {
            statusText: "request failed"
        });
    } finally {
        isRequestPending = false;
        sendBtn.disabled = false;
        sendBtn.textContent = "send";
        personaSelect.disabled = false;
        scheduleSleepTimer();
    }
});

petAvatar.addEventListener("click", () => {
    if (isRequestPending) {
        return;
    }

    setPetState("happy", {
        statusText: "Momo noticed your click.",
        autoReturnMs: 1500,
        returnTo: "idle"
    });
});

messageInput.addEventListener("focus",wakePet);
messageInput.addEventListener("input",scheduleSleepTimer);
window.addEventListener("keydown", wakePet);

setPetState("idle", {
    statusText: "Say something to your pet."
});

renderDesktopInfo();
