import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;
const maxTextLength = 5000;
const googleTranslateEndpoint =
  "https://translation.googleapis.com/language/translate/v2";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

const isPlaceholder = (value) =>
  !value || /^(your_|replace_|paste_|<)/i.test(String(value).trim());

const isLanguageCode = (value) =>
  typeof value === "string" && /^[a-zA-Z]{2,3}(?:-[a-zA-Z]{2,8})?$/.test(value);

const rtlLanguageCodes = new Set(["ar", "fa", "he", "ps", "ur", "yi"]);

const getGoogleApiKey = () => process.env.GOOGLE_TRANSLATE_API_KEY?.trim();

const googleErrorMessage = (data, statusText) =>
  data?.error?.message || statusText || "Google Cloud Translation request failed.";

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", provider: "google-cloud-translation-v2" });
});

app.get("/api/languages", async (_request, response) => {
  try {
    const apiKey = getGoogleApiKey();

    if (isPlaceholder(apiKey)) {
      return response.status(500).json({
        error:
          "GOOGLE_TRANSLATE_API_KEY is missing or still contains the example placeholder.",
      });
    }

    const url = new URL(`${googleTranslateEndpoint}/languages`);
    url.searchParams.set("target", "en");
    url.searchParams.set("model", "nmt");

    const apiResponse = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": apiKey,
      },
    });

    const data = await apiResponse.json().catch(() => null);

    if (!apiResponse.ok) {
      const message = googleErrorMessage(data, apiResponse.statusText);
      console.error("Google language list error:", {
        status: apiResponse.status,
        message,
      });

      return response.status(apiResponse.status).json({
        error: `Google Translation ${apiResponse.status}: ${message}`,
      });
    }

    const languages = (data?.data?.languages || [])
      .map(({ language, name }) => ({
        code: language,
        name: name || language,
        nativeName: name || language,
        dir: rtlLanguageCodes.has(language.split("-")[0]) ? "rtl" : "ltr",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return response.json({ languages });
  } catch (error) {
    console.error("Unexpected language list error:", error);
    return response.status(500).json({
      error: "An unexpected server error occurred while loading languages.",
    });
  }
});

app.post("/api/translate", async (request, response) => {
  try {
    const { text, from = "auto", to } = request.body || {};

    if (typeof text !== "string" || !text.trim()) {
      return response.status(400).json({ error: "Please enter text to translate." });
    }

    if (text.length > maxTextLength) {
      return response.status(400).json({
        error: `Text must be ${maxTextLength.toLocaleString()} characters or fewer.`,
      });
    }

    if (!isLanguageCode(to)) {
      return response.status(400).json({ error: "Choose a valid target language." });
    }

    if (from !== "auto" && !isLanguageCode(from)) {
      return response.status(400).json({ error: "Choose a valid source language." });
    }

    if (from !== "auto" && from === to) {
      return response.status(400).json({ error: "Choose two different languages." });
    }

    const apiKey = getGoogleApiKey();

    if (isPlaceholder(apiKey)) {
      return response.status(500).json({
        error:
          "GOOGLE_TRANSLATE_API_KEY is missing or still contains the example placeholder.",
      });
    }

    const body = {
      q: text.trim(),
      target: to,
      format: "text",
    };

    // Omitting source enables Google automatic language detection.
    if (from !== "auto") {
      body.source = from;
    }

    const apiResponse = await fetch(googleTranslateEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await apiResponse.json().catch(() => null);

    if (!apiResponse.ok) {
      const message = googleErrorMessage(data, apiResponse.statusText);
      const reason = data?.error?.errors?.[0]?.reason;

      console.error("Google Translation API error:", {
        status: apiResponse.status,
        reason,
        message,
      });

      const reasonText = reason ? ` (${reason})` : "";
      return response.status(apiResponse.status).json({
        error: `Google Translation ${apiResponse.status}${reasonText}: ${message}`,
      });
    }

    const result = data?.data?.translations?.[0];
    const translatedText = result?.translatedText;

    if (!translatedText) {
      return response.status(502).json({
        error: "Google Translation returned an unexpected response.",
      });
    }

    return response.json({
      translatedText,
      detectedLanguage: result?.detectedSourceLanguage || null,
      confidence: null,
    });
  } catch (error) {
    console.error("Unexpected translation error:", error);
    return response.status(500).json({
      error: "An unexpected server error occurred. Please try again.",
    });
  }
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(distPath));
  app.use((request, response, next) => {
    if (request.method !== "GET" || request.path.startsWith("/api/")) {
      return next();
    }

    return response.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Google Translator server running at http://localhost:${port}`);
});
