const express = require("express");
const path = require("path");
const chatRouter = require("./routes/chat");
const chessRouter = require("./routes/chess");
const errorHandler = require("./middleware/error-handler");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname,"..","..", "public")));

app.get("/health", (req, res) => {
    res.send("web-pet-mvp is running");
});

app.use("/api", chatRouter);
app.use("/api", chessRouter);
app.use(errorHandler);

module.exports = app;
