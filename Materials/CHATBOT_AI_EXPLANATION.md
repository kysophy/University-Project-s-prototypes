# Chatbot AI Explanation

## Quick Answer

**No, just running `app.py` alone is NOT enough for AI responses.**

The chatbot needs **Ollama installed and running separately** to use AI. However, the chatbot will still work with rule-based responses if Ollama isn't available.

## How It Actually Works

### When You Run `app.py`:

1. **The server starts** and checks if Ollama is available
2. **Two modes of operation:**

#### Mode 1: With Ollama Running ✅
- **High confidence queries (≥0.9)**: Rule-based responses (instant)
  - Simple greetings: "hello", "hi"
  - Exact dish names: "What is Phở?"
  - Very specific queries
  
- **Everything else (<0.9)**: **AI-powered responses** 🧠
  - "How cheap are the foods here?" → AI analyzes price data
  - "Compare restaurants" → AI reasons about your data
  - "What's good value?" → AI provides recommendations
  - **The AI learns from your restaurant, dish, and region data!**

#### Mode 2: Without Ollama ⚠️
- **High confidence queries (≥0.9)**: Rule-based responses (works fine)
- **Everything else**: Falls back to rule-based with lower threshold (≥0.7)
- **If still no match**: Generic helpful message

## What You Need for AI Responses

### Required Steps:

1. **Install Ollama** (separate application)
   ```bash
   # Download from: https://ollama.com/download
   # Or use package manager
   ```

2. **Download the model**
   ```bash
   ollama pull llama3.2:3b
   ```

3. **Make sure Ollama is running**
   - Ollama runs as a background service
   - Check: `ollama list` (should show llama3.2:3b)

4. **Then run your Flask app**
   ```bash
   python app.py
   ```

### What Happens at Startup:

When you run `app.py`, you'll see:
```
============================================================
🍜 Culinary Compass Chatbot Server Starting...
============================================================
✅ Ollama is running with model: llama3.2:3b
   → AI-powered responses are ENABLED
   → Most queries will use AI to learn from your data

📊 Data loaded:
   → Restaurants: 15
   → Dishes: 4
   → Regions: 4

🚀 Server running on http://localhost:5000
============================================================
```

OR (if Ollama not available):
```
⚠️  Ollama is NOT available
   → Chatbot will use rule-based responses only
   → To enable AI: Install Ollama and run: ollama pull llama3.2:3b
```

## How the AI Learns from Your Data

When a query goes to AI, the system:

1. **Loads your data:**
   - Restaurant names, prices, ratings, cuisines, tags
   - Dish information (ingredients, flavors, descriptions, history)
   - Region specialties
   - **Price statistics** (average, min, max)

2. **Sends it to Ollama** with a smart prompt:
   ```
   "You are an expert Vietnamese food assistant. 
   Here's the REAL DATA from the project:
   [Restaurant data]
   [Dish data]
   [Region data]
   
   USER QUESTION: [user's question]
   
   Use this data to answer accurately..."
   ```

3. **Ollama analyzes** the question and your data, then generates a response

4. **The response is cached** for faster future responses

## Example Flow

### Query: "How cheap are the foods here?"

**Without Ollama:**
- Rule-based tries to match → Low confidence (<0.9)
- Falls back to rule-based with lower threshold → Still low
- Returns generic message

**With Ollama:**
- Rule-based tries to match → Low confidence (<0.9)
- **AI takes over:**
  - Reads all restaurant prices from your data
  - Calculates statistics
  - Generates: "Food here is very affordable! Based on our data, most restaurants range from 25,000-80,000 VND per dish. Street food is typically 20,000-50,000 VND..."
  - **Uses actual restaurant names from your data!**

## Check If AI Is Working

### Method 1: Startup Message
Look at the console when starting `app.py` - it tells you if Ollama is available.

### Method 2: API Endpoint
Visit: `http://localhost:5000/api/chatbot/stats`

You'll see:
```json
{
  "ollama_available": true,  // ← This should be true
  "ollama_model": "llama3.2:3b",
  "use_ollama": true,
  ...
}
```

### Method 3: Test Query
Ask: "How cheap are the foods here?"

- **With AI**: Detailed answer with price ranges and restaurant names
- **Without AI**: Generic fallback message

## Summary

| Scenario | AI Responses? | What Happens |
|----------|---------------|--------------|
| Ollama installed + running | ✅ **YES** | Most queries use AI learning from your data |
| Ollama not installed | ❌ **NO** | Rule-based responses only (still works) |
| Ollama installed but not running | ❌ **NO** | Falls back to rule-based |

## Bottom Line

- **Running `app.py` alone**: Chatbot works, but uses rule-based only
- **Running `app.py` + Ollama**: Chatbot uses AI to learn from your data for most queries! 🎯

The AI doesn't just use your data - it **reasons about it** and provides intelligent, contextual answers based on what's actually in your restaurant, dish, and region files.

