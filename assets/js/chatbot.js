class ChatBot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.init();
    }

    init() {
        this.setupDOM();
        this.setupEventListeners();
        this.loadWelcomeMessage();
    }

    setupDOM() {
        const widget = document.querySelector('.chatbot-widget');
        
        widget.innerHTML = `
            <button class="chatbot-button" id="chatbotToggle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                </svg>
            </button>

            <div class="chatbot-container" id="chatbotContainer" style="display: none;">
                <div class="chatbot-header">
                    <div>
                        <p class="chatbot-header-title">Culinary Compass AI</p>
                        <p class="chatbot-header-subtitle">Always here to help</p>
                    </div>
                    <button class="chatbot-close-btn" id="chatbotClose">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <div class="chatbot-messages" id="chatbotMessages"></div>

                <div class="chatbot-input-area">
                    <form class="chatbot-input-form" id="chatbotForm">
                        <input 
                            type="text" 
                            class="chatbot-input" 
                            id="chatbotInput" 
                            placeholder="Ask me about tours, dishes..." 
                            autocomplete="off"
                        >
                        <button type="submit" class="chatbot-send-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const toggle = document.getElementById('chatbotToggle');
        const close = document.getElementById('chatbotClose');
        const form = document.getElementById('chatbotForm');
        const input = document.getElementById('chatbotInput');

        toggle.addEventListener('click', () => this.toggle());
        close.addEventListener('click', () => this.close());
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage(input.value.trim());
            input.value = '';
            input.focus();
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        const container = document.getElementById('chatbotContainer');
        const button = document.getElementById('chatbotToggle');
        
        container.style.display = 'flex';
        button.style.display = 'none';
        this.isOpen = true;
        
        // Focus input when opened
        setTimeout(() => {
            document.getElementById('chatbotInput').focus();
        }, 100);
    }

    close() {
        const container = document.getElementById('chatbotContainer');
        const button = document.getElementById('chatbotToggle');
        
        container.style.display = 'none';
        button.style.display = 'flex';
        this.isOpen = false;
    }

    loadWelcomeMessage() {
        setTimeout(() => {
            this.addBotMessage('👋 Welcome to Culinary Compass! I can help you discover the best Vietnamese cuisine in Ho Chi Minh City.');
            setTimeout(() => {
                this.addBotMessage('What would you like to know?');
                this.showQuickReplies();
            }, 1000);
        }, 500);
    }

    showQuickReplies() {
        const messagesDiv = document.getElementById('chatbotMessages');
        const quickReplyDiv = document.createElement('div');
        quickReplyDiv.className = 'message bot';
        quickReplyDiv.innerHTML = `
            <div style="width: 100%; display: flex; flex-direction: column; gap: 8px;">
                <button class="quick-reply" data-msg="Recommend a tour for me">Recommend a tour</button>
                <button class="quick-reply" data-msg="Tell me about Phở">Tell me about Phở</button>
                <button class="quick-reply" data-msg="Best street food spots">Best street food</button>
            </div>
        `;
        messagesDiv.appendChild(quickReplyDiv);
        // Attach listeners to quick replies (defensive: ensure chatbot exists)
        const replies = quickReplyDiv.querySelectorAll('.quick-reply');
        replies.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const msg = btn.getAttribute('data-msg') || '';
                if (msg) this.sendMessage(msg);
            });
        });

        this.scrollToBottom();
    }

    async sendMessage(text) {
        if (!text.trim()) return;

        // Add user message
        this.addUserMessage(text);
        this.messages.push({ type: 'user', text });

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Try to call backend API first (for AI-powered responses)
            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: text,
                    history: this.messages.slice(-6) // Last 3 exchanges for context
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.removeTypingIndicator();
                this.addBotMessage(data.response);
                
                // Show restaurant suggestions if provided
                if (data.restaurants && data.restaurants.length > 0) {
                    this.showRestaurantSuggestions(data.restaurants);
                }
                
                this.messages.push({ type: 'bot', text: data.response });
                return;
            }
        } catch (error) {
            console.warn('API call failed, using fallback:', error);
            // Fall through to rule-based fallback
        }

        // Fallback to original rule-based response (if API unavailable)
        setTimeout(() => {
            const response = this.getBotResponse(text);
            this.removeTypingIndicator();
            this.addBotMessage(response);
            this.messages.push({ type: 'bot', text: response });
        }, 800 + Math.random() * 600);
    }

    showRestaurantSuggestions(restaurants) {
        const messagesDiv = document.getElementById('chatbotMessages');
        if (!messagesDiv || !restaurants || restaurants.length === 0) return;

        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'message bot';
        suggestionDiv.innerHTML = `
            <div class="message-avatar">🍜</div>
            <div class="message-content">
                <p style="margin-bottom: 8px; font-weight: 500;">📍 Suggested Restaurants:</p>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    ${restaurants.map(name => `
                        <button 
                            class="restaurant-suggestion-btn" 
                            data-restaurant="${this.escapeHtml(name)}"
                            style="
                                background: white;
                                border: 1px solid #DC2626;
                                color: #DC2626;
                                padding: 8px 12px;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 13px;
                                text-align: left;
                                transition: all 0.2s;
                                font-family: inherit;
                            "
                        >
                            ${this.escapeHtml(name)}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        messagesDiv.appendChild(suggestionDiv);

        // Add click handlers
        suggestionDiv.querySelectorAll('.restaurant-suggestion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const restaurantName = e.target.getAttribute('data-restaurant');
                this.sendMessage(`Tell me about ${restaurantName}`);
            });

            // Hover effect
            btn.addEventListener('mouseenter', () => {
                btn.style.background = '#DC2626';
                btn.style.color = 'white';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'white';
                btn.style.color = '#DC2626';
            });
        });

        this.scrollToBottom();
    }

    addUserMessage(text) {
        const messagesDiv = document.getElementById('chatbotMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.innerHTML = `
            <div class="message-content">${this.escapeHtml(text)}</div>
            <div class="message-avatar">👤</div>
        `;
        messagesDiv.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addBotMessage(text) {
        const messagesDiv = document.getElementById('chatbotMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        messageDiv.innerHTML = `
            <div class="message-avatar">🍜</div>
            <div class="message-content">${this.escapeHtml(text)}</div>
        `;
        messagesDiv.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const messagesDiv = document.getElementById('chatbotMessages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typingIndicator';
        typingDiv.className = 'message bot';
        typingDiv.innerHTML = `
            <div class="message-avatar">🍜</div>
            <div class="typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;
        messagesDiv.appendChild(typingDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const typing = document.getElementById('typingIndicator');
        if (typing) typing.remove();
    }

    getBotResponse(userInput) {
        const input = userInput.toLowerCase();

        // Greeting responses
        if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
            return '👋 Hey there! Ready to explore some amazing Vietnamese food?';
        }

        // Tour responses
        if (input.includes('tour') || input.includes('recommend')) {
            return '🎯 I\'d recommend the "Classic Saigon" tour! It includes Cơm Tấm, Bánh Mì, and authentic Phở at local favorites. Would you like to design your own custom tour? Check out the "Design Your Tour" feature!';
        }

        // Phở responses
        if (input.includes('phở') || input.includes('pho')) {
            return '🍜 Phở is Vietnam\'s national treasure! Did you know Saigon Phở (Phở Nam) is sweeter and richer than the Northern style? It often includes fresh herbs, bean sprouts, and multiple protein options. Would you like to find nearby Phở restaurants?';
        }

        // Street food responses
        if (input.includes('street food') || input.includes('street food')) {
            return '🛣️ Saigon\'s street food culture is incredible! Best times to explore are early morning (5-8 AM) and late night (9 PM-2 AM). Tips: follow the locals, bring small bills (no cards at stalls), and remember "không cay" means not spicy!';
        }

        // Bánh Mì responses
        if (input.includes('bánh mì') || input.includes('banh mi')) {
            return '🥖 Bánh Mì is the perfect fusion of French and Vietnamese flavors! The crispy exterior with airy interior is achieved by mixing rice flour with wheat. Try the classic Thịt Nướng (grilled pork) or Thập Cẩm (full combo)!';
        }

        // Cơm Tấm responses
        if (input.includes('cơm tấm') || input.includes('com tam')) {
            return '🍚 Cơm Tấm, the "broken rice," started as food for working class but became a beloved dish! It\'s typically served with grilled pork, egg, pickled vegetables, and Vietnamese sauce. It\'s affordable, delicious, and authentic!';
        }

        // Hours and info
        if (input.includes('open') || input.includes('hours') || input.includes('when')) {
            return '⏰ Most restaurants open 6-10 AM for breakfast and 11 AM-9 PM for lunch/dinner. Street food vendors often work early morning or late night. Check individual restaurant pages for specific hours!';
        }

        // Price responses
        if (input.includes('price') || input.includes('cost') || input.includes('expensive')) {
            return '💰 Vietnamese street food is very affordable! Expect 20,000-50,000 VND ($1-3 USD) for most dishes. Fine dining restaurants range 200,000-500,000+ VND. Check our search filters to find places in your budget!';
        }

        // Search responses
        if (input.includes('search') || input.includes('find') || input.includes('look')) {
            return '🔍 Use the "Search" or "Explore All Restaurants" button to filter by cuisine type, price range, rating, or opening hours. You can also use the "Design Your Tour" feature for a guided experience!';
        }

        // Default responses
        const responses = [
            '😊 That\'s a great question! You can explore restaurants using the Search feature, or check out the "Culinary Stories" section to learn about iconic Vietnamese dishes.',
            '🌟 I love your curiosity! Visit the "Design Your Tour" page to create a custom itinerary based on your food preferences.',
            '✨ You can find information about Vietnamese cuisine and restaurants throughout our app. What aspect interests you most?',
            '👨‍🍳 Vietnamese cuisine is so diverse! Would you like recommendations for a specific dish or area in Ho Chi Minh City?'
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    scrollToBottom() {
        const messagesDiv = document.getElementById('chatbotMessages');
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new ChatBot();
});

/* Quick reply button styling */
const style = document.createElement('style');
style.textContent = `
    .quick-reply {
        background: white;
        border: 1px solid #DC2626;
        color: #DC2626;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        transition: all 0.2s;
        text-align: left;
    }

    .quick-reply:hover {
        background: #DC2626;
        color: white;
    }

    .quick-reply:active {
        transform: scale(0.95);
    }
`;
document.head.appendChild(style);
