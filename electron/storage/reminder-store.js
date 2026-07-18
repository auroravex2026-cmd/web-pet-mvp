const { randomUUID } = require("node:crypto");

function createReminder(database, reminderInput) {
    if (!reminderInput || typeof reminderInput.content !== "string") {
        throw new Error("Reminder content must be a string.");
    }

    const content = reminderInput.content.trim();

    if (content === "") {
        throw new Error("Reminder content cannot be empty.");
    }

    const now = new Date().toISOString();

    const reminder = {
        id: randomUUID(),
        content,
        dueAt: null,
        status: "active",
        createdAt: now,
        updatedAt: now,
        completedAt: null
    };

    database.prepare(`
        INSERT INTO reminders (
            id,
            content,
            due_at,
            status,
            created_at,
            updated_at,
            completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        reminder.id,
        reminder.content,
        reminder.dueAt,
        reminder.status,
        reminder.createdAt,
        reminder.updatedAt,
        reminder.completedAt
    );

    return reminder;
}

function listActiveReminders(database) {
    return database.prepare(`
        SELECT
            id,
            content,
            due_at AS dueAt,
            status,
            created_at AS createdAt,
            updated_at AS updatedAt,
            completed_at AS completedAt
        FROM reminders
        WHERE status = ?
        ORDER BY created_at DESC
    `).all("active");
}

module.exports = {
    createReminder,
    listActiveReminders
};