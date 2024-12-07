## Purpose
This is a web application that combines OCR (Optical Character Recognition) and AI to extract structured data from images of invoices/receipts.


## Running the Project

1. **Clone Repository**

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Open your browser and navigate to `http://localhost:3000`
   - Ensure WebGPU is enabled (see WebGPU setup instructions below)




#### Enabling WebGPU in Chrome
WebGPU is disabled when the user has turned off "Use graphics acceleration when available" in chrome://settings/system . Check to see if this setting is turned off and turn it back on. WebGPU is not supported on this platform yet. You can enable the chrome://flags/#enable-unsafe-webgpu flag and restart Chrome to enable it.

1. **Open Browser**
   - Launch Google Chrome

2. **Access Flags Page**
   - Type `chrome://flags` in address bar
   - Press Enter

3. **Enable WebGPU Flag**
   - Search for 'enable-unsafe-webgpu'
   - Find #enable-unsafe-webgpu flag
   - Set dropdown menu to "Enabled"

4. **Restart Browser**
   - Click Relaunch button to apply changes



## Key Components

### 1. Technologies Used
- **@mlc-ai/web-llm**: For running AI models in the browser
- **Tesseract.js**: For OCR (converting images to text)
- **Ace Editor**: For JSON schema editing
- **Highlight.js**: For syntax highlighting

### 2. Core Features
- Image upload and preview
- OCR text extraction
- AI-powered JSON data extraction based on a schema
- Model selection (SmolLM2 variants)
- Real-time performance statistics

## Setup Instructions

1. **Dependencies Installation**
```bash
npm install @mlc-ai/web-llm tesseract.js ace-builds highlight.js
```

2. **HTML Requirements**
Your HTML needs these elements:
```html
<select id="model-selection"></select>
<input type="file" id="image-upload">
<img id="image-preview">
<div id="image-preview-container">
<textarea id="extracted-text"></textarea>
<div id="output"></div>
<p id="stats"></p>
<div id="schema"></div>
<button id="generate">Generate</button>
```

## How It Works

1. **Initialization Flow**
   - Loads when DOM is ready
   - Initializes Tesseract worker for OCR
   - Sets up model selection dropdown
   - Configures JSON schema editor
   - Sets up event listeners

2. **Processing Pipeline**
   ```mermaid
   graph LR
   A[Image Upload] --> B[OCR Processing]
   B --> C[Text Extraction]
   C --> D[AI Processing]
   D --> E[JSON Output]
   ```

3. **Key Features**
   - **Model Selection**: Filters and displays available SmolLM2 models
   - **Image Processing**: Handles image upload, preview, and OCR
   - **Schema Definition**: Configurable JSON schema for structured data extraction
   - **AI Processing**: Uses the selected model to convert OCR text into structured JSON
   - **Performance Monitoring**: Tracks and displays processing speeds

## Important Concepts

1. **OCR Integration**
   - Uses Tesseract.js worker for image-to-text conversion
   - Runs asynchronously to prevent UI blocking

2. **AI Model Management**
   - Lazy loading of AI models (only when needed)
   - Model switching capability
   - Streaming response support

3. **Data Extraction**
   - Schema-based extraction ensures consistent output format
   - Uses system prompts to guide AI behavior
   - Supports structured JSON output

4. **Resource Management**
   - Proper cleanup of Tesseract worker on page unload
   - Engine reset on model change
   - Error handling throughout the pipeline

## Usage Tips

1. Start by selecting an appropriate model from the dropdown
2. Upload an invoice/receipt image
3. Wait for OCR processing to complete
4. Modify the JSON schema if needed
5. Click "Generate" to extract structured data
6. Monitor performance metrics in the stats section

This setup provides a complete pipeline for converting document images into structured data using browser-based AI and OCR technologies.



## Credits

This project was adapted from [github-issue-generator-webgpu](https://github.com/Vaibhavs10/github-issue-generator-webgpu) by [Vaibhavs10](https://github.com/Vaibhavs10). Thank you for the inspiration and foundation!



Other resources:
- https://huggingface.co/collections/Xenova/transformersjs-demos-64f9c4f49c099d93dbc611df
- https://github.com/huggingface/transformers.js-examples
- https://smollm2.netlify.app