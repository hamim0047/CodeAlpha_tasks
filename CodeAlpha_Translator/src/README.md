# AuraLang Translator

AuraLang Translator is a modern, responsive language translation web application built with **ReactJS**, **Vite**, **Tailwind CSS**, and **Express.js**. It uses the **Google Cloud Translation API** to translate text between multiple languages while keeping the API key secure on the backend.

The interface uses a colorful glassmorphism design with lightweight animations, responsive layouts, text-to-speech, clipboard support, automatic language detection, and language swapping.

---

## Features

- Translate text between multiple languages
- Automatic source-language detection
- Source and target language selection
- Swap source and target languages
- Copy translated text to clipboard
- Text-to-speech support using the browser Speech Synthesis API
- Character counter with a 5,000-character limit
- Responsive design for mobile, tablet, laptop, and desktop screens
- Colorful glassmorphism user interface
- Lightweight React animations
- Loading, success, warning, and error states
- Keyboard shortcut for translation
- Secure server-side Google Translation API integration

---

## Tech Stack

### Frontend

- ReactJS
- Vite
- Tailwind CSS
- Motion for React
- Lucide React
- Browser Clipboard API
- Browser Speech Synthesis API

### Backend

- Node.js
- Express.js
- dotenv
- Google Cloud Translation API

---

## Project Structure

```text
Translator/
├── public/
├── src/
│   ├── components/
│   │   ├── ActionButton.jsx
│   │   └── LanguageSelect.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── server.js
├── index.html
├── vite.config.js
├── package.json
├── package-lock.json
├── .env
├── .gitignore
└── README.md
```

---

## Prerequisites

Before running the project, make sure you have:

- Node.js 18 or newer
- npm
- A Google Cloud account
- Cloud Translation API enabled
- A Google Cloud Translation API key

Check your Node.js version:

```bash
node -v
```

Check npm:

```bash
npm -v
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

Open the project folder:

```bash
cd Translator
```

Install the required packages:

```bash
npm install
```

If any UI dependencies are missing, install them with:

```bash
npm install motion lucide-react
```

Install Tailwind CSS for Vite if needed:

```bash
npm install -D tailwindcss @tailwindcss/vite
```

Install backend dependencies if needed:

```bash
npm install express dotenv
```

---

## Google Cloud Translation API Setup

### 1. Create a Google Cloud project

Open Google Cloud Console and create or select a project.

### 2. Enable Cloud Translation API

Go to:

```text
APIs & Services
→ Library
→ Cloud Translation API
→ Enable
```

### 3. Create an API key

Go to:

```text
APIs & Services
→ Credentials
→ Create Credentials
→ API Key
```

For better security, restrict the API key so it can only access the Cloud Translation API.

---

## Environment Variables

Create a `.env` file in the root of the project:

```text
Translator/
├── .env
├── server.js
├── package.json
└── ...
```

Add:

```env
GOOGLE_TRANSLATE_API_KEY=your_google_translation_api_key
PORT=3001
```

Do not expose the API key in React code.

Do not use:

```env
VITE_GOOGLE_TRANSLATE_API_KEY=your_key
```

Variables beginning with `VITE_` can be included in the frontend bundle and may become visible to users.

---

## Running the Project Locally

The frontend and backend run on different ports during development.

### Start the backend

Open a terminal in the project directory:

```bash
node server.js
```

The backend should run at:

```text
http://localhost:3001
```

### Start the React frontend

Open another terminal:

```bash
npm run dev
```

The frontend normally runs at:

```text
http://localhost:5173
```

Open that address in your browser.

---

## Vite Proxy Configuration

During development, React sends requests such as:

```text
/api/translate
```

The Vite development server forwards them to the Express backend.

Example `vite.config.js`:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 5173,

    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
```

---

## API Flow

AuraLang uses the following request flow:

```text
User
  ↓
React Frontend
  ↓
POST /api/translate
  ↓
Express Backend
  ↓
Google Cloud Translation API
  ↓
Express Backend
  ↓
React Frontend
  ↓
Translated Text
```

The Google API key stays on the backend and is never sent to the browser.

---

## Translation Request

The frontend sends:

```json
{
  "text": "Hello world",
  "from": "en",
  "to": "bn"
}
```

If automatic language detection is selected:

```json
{
  "text": "Hello world",
  "from": "auto",
  "to": "bn"
}
```

Example response:

```json
{
  "translatedText": "হ্যালো বিশ্ব",
  "detectedLanguage": "en",
  "confidence": null
}
```

---

## Main API Endpoints

### Get supported languages

```http
GET /api/languages
```

### Translate text

```http
POST /api/translate
```

Example request body:

```json
{
  "text": "How are you?",
  "from": "en",
  "to": "bn"
}
```

---

## Text-to-Speech

AuraLang uses the browser's built-in Speech Synthesis API.

Example:

```js
const utterance = new SpeechSynthesisUtterance(translatedText);
utterance.lang = targetLanguage;

window.speechSynthesis.speak(utterance);
```

Speech availability depends on:

- Browser
- Operating system
- Installed voices
- Selected language

Some languages may not have a suitable voice installed on every device.

---

## Copy to Clipboard

Translated text can be copied using the browser Clipboard API:

```js
await navigator.clipboard.writeText(translatedText);
```

---

## Keyboard Shortcut

Press:

```text
Ctrl + Enter
```

on Windows/Linux, or:

```text
Command + Enter
```

on macOS to translate the current text.

---

## Responsive Design

AuraLang is designed to work on:

- Small smartphones
- Large smartphones
- Tablets
- Laptops
- Desktop monitors
- Large displays

The interface changes automatically depending on screen width.

On smaller screens:

- Language selectors stack vertically
- Translation panels appear one below another
- Buttons remain touch-friendly
- Text areas resize appropriately

On larger screens:

- Language selectors appear horizontally
- Source and translation panels appear side by side

---

## UI Design

The interface includes:

- Glassmorphism cards
- Gradient accents
- Cyan, violet, and fuchsia colors
- Transparent borders
- Responsive shadows
- Lightweight Motion animations
- CSS hover interactions
- Reduced-motion accessibility support

Heavy continuous animations are intentionally avoided to improve performance on lower-powered devices.

---

## Build for Production

Create a production build:

```bash
npm run build
```

Vite generates the production files inside:

```text
dist/
```

You can preview the production frontend locally using:

```bash
npm run preview
```

---

## Deployment

Because AuraLang contains both a React frontend and an Express backend, deploy it to a platform that supports Node.js applications.

Possible options include:

- Render
- Railway
- Fly.io
- DigitalOcean
- VPS hosting
- Other Node.js hosting providers

When deploying, add the following environment variable through the hosting provider's dashboard:

```text
GOOGLE_TRANSLATE_API_KEY
```

Do not upload your `.env` file to GitHub.

---

## Recommended `.gitignore`

```gitignore
node_modules/
dist/

.env
.env.local
.env.production

.DS_Store
```

---

## Security

Never put your Google API key directly inside:

```text
src/App.jsx
src/main.jsx
vite.config.js
```

Do not commit `.env` to GitHub.

The API key should only be accessed through:

```js
process.env.GOOGLE_TRANSLATE_API_KEY
```

inside the backend.

For production, configure API restrictions and usage limits in Google Cloud.

---

## Troubleshooting

### `motion/react` cannot be resolved

Install Motion:

```bash
npm install motion
```

### `lucide-react` cannot be resolved

Install Lucide React:

```bash
npm install lucide-react
```

### `@tailwindcss/vite` cannot be resolved

Install Tailwind CSS and its Vite integration:

```bash
npm install -D tailwindcss @tailwindcss/vite
```

### Tailwind PostCSS error

If you are using the Tailwind Vite plugin, remove old PostCSS configuration that contains:

```js
tailwindcss: {}
```

Use:

```css
@import "tailwindcss";
```

inside `src/index.css`.

### `dotenv` cannot be resolved

Run:

```bash
npm install dotenv
```

### `/api/translate` returns 404

Make sure the Express backend is running:

```bash
node server.js
```

Also make sure `vite.config.js` contains the `/api` proxy to:

```text
http://localhost:3001
```

### Translation fails

Check:

1. Cloud Translation API is enabled.
2. The Google API key is valid.
3. Billing/API access is configured correctly.
4. `.env` contains the correct key.
5. The backend was restarted after editing `.env`.
6. The API key restrictions allow Cloud Translation API.

### Browser does not speak translated text

The browser may not have a voice installed for the selected language.

Try:

- Chrome
- Safari
- English as the target language
- Installing additional system voices

---

## Future Improvements

Possible future additions:

- Translation history
- Favorite translations
- Dark/light theme switcher
- Voice input
- File translation
- User accounts
- Saved translations
- Download translated text
- More languages
- AI-assisted translation suggestions
- Pronunciation controls
- Translation history stored locally

---

## Author

**Hamim**

---

## Project

**CodeAlpha — AuraLang Translator**

A responsive React-based translation application created using Google Cloud Translation API.

---

## License

This project is intended for educational and development purposes.

If you plan to distribute or commercialize the application, add an appropriate open-source license such as MIT.