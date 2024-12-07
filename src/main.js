import { prebuiltAppConfig, CreateMLCEngine } from "@mlc-ai/web-llm";
import hljs from "highlight.js";
import ace from "ace-builds";
import { createWorker } from "tesseract.js";

let engine = null;
let tesseractWorker = null;

document.addEventListener("DOMContentLoaded", async () => {
  const modelSelection = document.getElementById("model-selection");
  const imageUpload = document.getElementById("image-upload");
  const imagePreview = document.getElementById("image-preview");
  const imagePreviewContainer = document.getElementById(
    "image-preview-container"
  );
  const extractedText = document.getElementById("extracted-text");
  const outputDiv = document.getElementById("output");
  const statsParagraph = document.getElementById("stats");
  const extractionCleanOutput = document.getElementById("extraction-output");

  // Initialize Tesseract worker
  tesseractWorker = await createWorker("eng");

  // Populate model selection dropdown
  const availableModels = prebuiltAppConfig.model_list
    // .filter((m) => m.model_id.includes("SmolLM2"))
    .filter((m) => m.model_id.includes("Phi"))
    .map((m) => m.model_id);

  let selectedModel = availableModels[0];

  availableModels.forEach((modelId) => {
    const option = document.createElement("option");
    option.value = modelId;
    option.textContent = modelId;
    modelSelection.appendChild(option);
  });

  modelSelection.value = selectedModel;

  modelSelection.onchange = (e) => {
    selectedModel = e.target.value;
    engine = null; // Reset the engine when the model changes
  };

  // Setup JSON Schema Editor
  const jsonSchemaEditor = ace.edit("schema", {
    mode: "ace/mode/javascript",
    theme: "ace/theme/github",
    wrap: true,
  });

  // Set invoice schema
  jsonSchemaEditor.setValue(`{
    "title": "Invoice",
    "type": "object",
    "properties": {
      "invoice_number": {
        "type": "string",
        "description": "The invoice number"
      },
      "date": {
        "type": "string",
        "description": "Invoice date"
      },
      "vendor": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "address": { "type": "string" },
          "contact": { "type": "string" }
        }
      },
      "customer": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "address": { "type": "string" },
          "contact": { "type": "string" }
        }
      },
      "items": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "quantity": { "type": "number" },
            "unit_price": { "type": "number" },
            "amount": { "type": "number" }
          }
        }
      },
      "subtotal": { "type": "number" },
      "tax": { "type": "number" },
      "total": { "type": "number" }
    },
    "required": [
      "invoice_number",
      "date",
      "vendor",
      "items",
      "total"
    ]
  }`);

  // Handle image upload
  imageUpload.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      imagePreviewContainer.classList.remove("hidden");
    };
    reader.readAsDataURL(file);

    // Process image with Tesseract
    try {
      extractedText.value = "Processing image...";
      const result = await tesseractWorker.recognize(file);
      extractedText.value = result.data.text;
    } catch (error) {
      console.error("OCR error:", error);
      extractedText.value = `Error processing image: ${error.message}`;
    }
  });

  const extractionEngine = async (engine, extractedText) => {
    try {
      const schemaInput = jsonSchemaEditor.getValue();
      const schema = JSON.stringify(JSON.parse(schemaInput)); // Validate JSON
      const response_format = { type: "json_object", schema };

      const systemPrompt = `
      You are a data extraction assistant. Given the cleaned text from a receipt, you must parse and identify key details.`;

      const prompt = `Extracted text: ${extractedText}`;

      const request = {
        stream: true,
        stream_options: { include_usage: true },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: 1024,
        response_format,
      };

      let curMessage = "";
      let usage = null;
      outputDiv.innerHTML = '<div class="loading">Generating JSON...</div>';

      const generator = await engine.chatCompletion(request);

      for await (const chunk of generator) {
        const curDelta = chunk.choices[0]?.delta.content;
        if (curDelta) curMessage += curDelta;
        if (chunk.usage) {
          console.log(chunk.usage);
          usage = chunk.usage;
        }
        outputDiv.innerHTML = `<pre><code class="language-json">${curMessage}</code></pre>`;
      }

      const finalMessage = await engine.getMessage();
      outputDiv.innerHTML = hljs.highlight(finalMessage, {
        language: "json",
      }).value;

      return usage;
    } catch (error) {
      console.error("Generation error:", error);
      outputDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
  };

  const cleanExtractedText = async (engine, extractedText) => {
    try {
      const systemPrompt = `You are a text cleaning and normalization assistant. Your task is to transform raw OCR-extracted text into a clean, coherent, and human-readable form. You must remove extraneous characters, fix spacing and line breaks where possible, and preserve meaningful information. Do not infer missing data; simply correct obvious errors and output the cleaned text.
      Return only the cleaned text and nothing else.`;

      const prompt = `Extracted text: ${extractedText}`;

      const request = {
        stream: true,
        stream_options: { include_usage: true },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: 1024,
      };

      let curMessage = "";
      let usage = null;
      extractionCleanOutput.innerHTML =
        '<div class="loading">Cleaning text...</div>';

      const generator = await engine.chatCompletion(request);

      for await (const chunk of generator) {
        const curDelta = chunk.choices[0]?.delta.content;
        if (curDelta) curMessage += curDelta;
        if (chunk.usage) {
          usage = chunk.usage;
        }
      }

      const finalMessage = await engine.getMessage();
      extractionCleanOutput.innerHTML = `<pre>${finalMessage}</pre>`;

      return finalMessage;
    } catch (error) {
      console.error("Error cleaning extracted text:", error);
      extractionCleanOutput.innerHTML = `<div class="error">Error: ${error.message}</div>`;
      return null;
    }
  };

  // Generate button click handler
  document.getElementById("generate").onclick = async () => {
    try {
      if (!extractedText.value) {
        throw new Error("Please upload and process an image first");
      }

      outputDiv.innerHTML = '<div class="loading">Initializing model...</div>';

      if (!engine) {
        engine = await CreateMLCEngine(selectedModel, {
          initProgressCallback: (progress) => {
            console.log(progress);
            outputDiv.innerHTML = `<div class="loading">${progress.text}</div>`;
          },
        });
      }

      let value = extractedText.value;

      // const cleanedText = await cleanExtractedText(engine, value);

      // if (cleanedText) {
      //   value = cleanedText;
      // }

      const usage = await extractionEngine(engine, value);

      if (usage) {
        const statsTextParts = [];
        if (usage.extra.prefill_tokens_per_s) {
          statsTextParts.push(
            `Prefill Speed: ${usage.extra.prefill_tokens_per_s.toFixed(
              1
            )} tok/s`
          );
        }
        if (usage.extra.decode_tokens_per_s) {
          statsTextParts.push(
            `Decode Speed: ${usage.extra.decode_tokens_per_s.toFixed(1)} tok/s`
          );
        }
        statsParagraph.textContent = statsTextParts.join(" | ");
        statsParagraph.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Generation error:", error);
      outputDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
  };
});

// Cleanup when page is unloaded
window.addEventListener("beforeunload", async () => {
  if (tesseractWorker) {
    await tesseractWorker.terminate();
  }
});
