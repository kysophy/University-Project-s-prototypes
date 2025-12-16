# Ollama Setup Guide for Chatbot AI

This guide will help you set up Ollama with llama3.2:3b to enable AI-powered responses in the chatbot.

## What is Ollama?

Ollama is a tool that runs large language models (LLMs) locally on your computer. It's completely free and doesn't require internet access once set up.

## Step 1: Install Ollama

### Windows:
1. Download Ollama from: https://ollama.com/download
2. Run the installer (OllamaSetup.exe)
3. Follow the installation wizard
4. Ollama will start automatically

### macOS:
```bash
# Using Homebrew
brew install ollama

# Or download from: https://ollama.com/download
```

### Linux:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

## Step 2: Download the llama3.2:3b Model

Open a terminal/command prompt and run:

```bash
ollama pull llama3.2:3b
```

This will download the model (about 2GB). The first time may take a few minutes.

**Alternative models you can try:**
- `llama3.2:1b` - Smaller, faster (1GB)
- `llama3.2:3b` - Recommended balance (2GB) ✅
- `llama3.1:8b` - More capable but slower (4.6GB)

## Step 3: Verify Ollama is Running

1. Check if Ollama is running:
   ```bash
   ollama list
   ```
   You should see `llama3.2:3b` in the list.

2. Test Ollama directly:
   ```bash
   ollama run llama3.2:3b "Hello, how are you?"
   ```

3. Check if the API is accessible:
   - Open browser: http://localhost:11434/api/tags
   - You should see JSON with model information

## Step 4: Configure the Chatbot

The chatbot is already configured to use Ollama! Check `app.py`:

```python
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2:3b"
USE_OLLAMA = True
```

These settings are already correct. No changes needed!

## Step 5: Start Your Flask App

```bash
python app.py
```

The chatbot will automatically:
1. Try rule-based responses first (for simple queries)
2. Use Ollama AI for complex/varied questions
3. Fall back gracefully if Ollama isn't available

## Step 6: Test the Chatbot

1. Open your web app
2. Ask the chatbot: "How cheap are the food here?"
3. The AI should now provide detailed price information using your restaurant data!

## Troubleshooting

### Problem: "Ollama not available" messages

**Solution:**
- Make sure Ollama is running: Check Task Manager (Windows) or Activity Monitor (Mac)
- Start Ollama manually if needed:
  ```bash
  ollama serve
  ```

### Problem: Slow responses

**Solutions:**
- Use a smaller model: `llama3.2:1b` (faster but less capable)
- The chatbot caches responses, so repeated questions are instant
- First response may be slower as the model loads

### Problem: Model not found

**Solution:**
```bash
ollama pull llama3.2:3b
```

### Problem: Port 11434 already in use

**Solution:**
- Another Ollama instance might be running
- Close other Ollama processes
- Or change the port in `app.py` (not recommended)

## How It Works

1. **Rule-Based (Fast)**: Simple queries like "hello", "what is phở" → Instant responses
2. **AI-Powered (Smart)**: Complex queries like "how cheap are foods", "compare restaurants" → Uses Ollama with your data
3. **Fallback**: If Ollama isn't available → Still works with rule-based responses

## Performance Tips

- **First query**: May take 3-5 seconds (model loading)
- **Subsequent queries**: Usually 1-3 seconds
- **Cached queries**: Instant (< 100ms)
- **Rule-based queries**: Always instant

## Advanced: Using Different Models

To use a different model, change in `app.py`:

```python
OLLAMA_MODEL = "llama3.1:8b"  # More capable but slower
```

Then pull the new model:
```bash
ollama pull llama3.1:8b
```

## Need Help?

- Ollama documentation: https://ollama.com/docs
- Check if Ollama is running: `ollama list`
- Test API: http://localhost:11434/api/tags
- Check chatbot stats: Visit `/api/chatbot/stats` endpoint

---

**Note**: Ollama runs entirely on your computer. No data is sent to external servers. It's completely private and free!

