# Web Pet MVP

![Web Pet thinking state](public/images/readme-pet-thinking.png)

A small web pet chat MVP. The page shows a character pet, switches the pet image by state, and sends chat messages to an OpenAI-compatible chat API through the backend.

## Features

- Chat with a pet character in the browser.
- Keep multi-turn conversation history on the frontend.
- Send chat requests through an Express backend.
- Load API settings from a local `.env` file.
- Show different pet states with character images:
  - `idle`
  - `thinking`
  - `happy`
  - `sleepy`
- Use static pet images from `public/images/pet/mansui/`.

## Requirements

- Node.js 18 or newer
- npm

## Install

```powershell
cd D:\web-pet-mvp
npm install
```

## Configure Environment

Create a `.env` file in the project root:

```env
PORT=3000
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=your-url
OPENAI_MODEL=your_model_here
```

Environment variables:

- `PORT`: local server port. Default is `3000`.
- `OPENAI_API_KEY`: your API key. Do not commit this value to GitHub.
- `OPENAI_BASE_URL`: OpenAI-compatible API base URL.
- `OPENAI_MODEL`: chat model name used by the backend.

You can use an OpenAI-compatible proxy service as the base URL. For example:

```env
OPENAI_BASE_URL=https://right.codes/codex/v1
```

The real `.env` file is ignored by Git through `.gitignore`.

## Run

Development mode:

```powershell
npm run dev
```

Normal start:

```powershell
npm start
```

Then open:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/health
```

## Project Structure

```text
web-pet-mvp/
  public/
    index.html
    main.js
    styles.css
    images/
      pet/
        mansui/
          pet-idle.png
          pet-thinking.png
          pet-happy.png
          pet-sleepy.png
  src/
    app.js
    server.js
    routes/
      chat.js
    services/
      chat.service.js
    config/
      persona.js
    middleware/
      error-handler.js
  package.json
  package-lock.json
  .gitignore
```

## Notes

- Keep `.env` private.
- Commit `package.json` and `package-lock.json`.
- Do not commit `node_modules`.
- Pet images are part of the app and should be committed if you want the project to run with the default character.
