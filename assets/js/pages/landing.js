// Region data
const regions = {
    hanoi: {
        name: 'Hà Nội',
        nameEn: 'Hanoi',
        description: 'The thousand-year-old capital with rich traditional Northern Vietnamese cuisine',
        specialties: ['Phở', 'Bún chả', 'Chả cá Lã Vọng']
    },
    saigon: {
        name: 'TP. Hồ Chí Minh',
        nameEn: 'Ho Chi Minh City',
        description: 'A vibrant city with diverse and abundant Southern Vietnamese cuisine',
        specialties: ['Bánh mì', 'Hủ tiếu', 'Cơm tấm']
    },
    danang: {
        name: 'Đà Nẵng',
        nameEn: 'Da Nang',
        description: 'A coastal city with fresh seafood and unique Central Vietnamese dishes',
        specialties: ['Mì Quảng', 'Bún chả cá', 'Bánh tráng cuốn thịt heo']
    },
    hue: {
        name: 'Huế',
        nameEn: 'Hue',
        description: 'The ancient capital with refined royal cuisine and distinctive flavors',
        specialties: ['Bún bò Huế', 'Bánh bèo', 'Cơm hến']
    }
};

// State
let selectedRegion = null;
let isEntering = false;

// DOM Elements
const regionCards = document.querySelectorAll('.region-card');
const startButton = document.getElementById('startButton');
const buttonText = document.getElementById('buttonText');
const selectionPrompt = document.getElementById('selectionPrompt');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeRegionCards();
    initializeStartButton();
    
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add entrance animations
    animateOnScroll();
});

// Initialize region card click handlers
function initializeRegionCards() {
    regionCards.forEach(card => {
        card.addEventListener('click', () => {
            const regionId = card.getAttribute('data-region');
            selectRegion(regionId, card);
        });
        
        // Add hover sound effect (optional)
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    });
}

// Select a region
function selectRegion(regionId, cardElement) {
    // If clicking the same card, deselect it
    if (selectedRegion === regionId) {
        selectedRegion = null;
        cardElement.classList.remove('selected');
        updateButtonState();
        return;
    }
    
    // Remove selection from all cards
    regionCards.forEach(card => {
        card.classList.remove('selected');
    });
    
    // Select the clicked card
    selectedRegion = regionId;
    cardElement.classList.add('selected');
    
    // Update button state
    updateButtonState();
    
    // Show selection feedback
    showSelectionFeedback(regionId);
    
    // Optional: Scroll to button on mobile
    if (window.innerWidth < 768) {
        setTimeout(() => {
            startButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }
}

// Update button state based on selection
function updateButtonState() {
    if (selectedRegion) {
        startButton.disabled = false;
        selectionPrompt.classList.add('hidden');
        
        // Add a subtle animation
        startButton.style.animation = 'pulse 0.5s ease';
        setTimeout(() => {
            startButton.style.animation = '';
        }, 500);
    } else {
        startButton.disabled = true;
        selectionPrompt.classList.remove('hidden');
    }
}

// Show selection feedback
function showSelectionFeedback(regionId) {
    const region = regions[regionId];
    
    // Create a temporary notification (optional enhancement)
    const notification = document.createElement('div');
    notification.className = 'selection-notification';
    notification.textContent = `Selected ${region.name}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #EA580C, #DC2626);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(220, 38, 38, 0.3);
        font-weight: 600;
        z-index: 1000;
        animation: slideInRight 0.4s ease, fadeOut 0.4s ease 2.6s;
    `;
    
    document.body.appendChild(notification);
    
    // Add animation styles if not already present
    if (!document.getElementById('notification-animations')) {
        const style = document.createElement('style');
        style.id = 'notification-animations';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes fadeOut {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize start button
function initializeStartButton() {
    startButton.addEventListener('click', handleStartJourney);
}

// Handle start journey
function handleStartJourney() {
    if (!selectedRegion || isEntering) return;
    
    isEntering = true;
    const region = regions[selectedRegion];
    
    // Update button text
    buttonText.textContent = 'Đang vào...';
    startButton.disabled = true;
    
    // Add loading animation
    startButton.style.opacity = '0.7';
    
    // Show welcome message
    setTimeout(() => {
        showWelcomeModal(region);
    }, 800);
}

// Show welcome modal
function showWelcomeModal(region) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'welcome-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-icon">🍜</div>
            <h2 class="modal-title">Welcome to</h2>
            <h3 class="modal-region">${region.name}</h3>
            <p class="modal-description">${region.description}</p>
            <div class="modal-specialties">
                ${region.specialties.map(item => `<span class="modal-tag">${item}</span>`).join('')}
            </div>
            <button class="modal-button" onclick="proceedToMap()">Start Exploring</button>
        </div>
    `;
    
    // Add modal styles
    if (!document.getElementById('modal-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .welcome-modal {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                animation: fadeIn 0.3s ease;
                padding: 20px;
            }
            
            .modal-content {
                background: white;
                padding: 3rem;
                border-radius: 24px;
                max-width: 500px;
                width: 100%;
                text-align: center;
                animation: scaleIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            
            .modal-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                animation: bounce 1s infinite;
            }
            
            .modal-title {
                font-size: 1.25rem;
                color: #6B7280;
                margin-bottom: 0.5rem;
            }
            
            .modal-region {
                font-size: 2.5rem;
                font-weight: 700;
                color: #DC2626;
                margin-bottom: 1rem;
            }
            
            .modal-description {
                font-size: 1rem;
                color: #6B7280;
                margin-bottom: 1.5rem;
                line-height: 1.6;
            }
            
            .modal-specialties {
                display: flex;
                flex-wrap: wrap;
                gap: 0.75rem;
                justify-content: center;
                margin-bottom: 2rem;
            }
            
            .modal-tag {
                background: #FEF3C7;
                color: #D97706;
                padding: 0.5rem 1rem;
                border-radius: 50px;
                font-size: 0.875rem;
                font-weight: 600;
            }
            
            .modal-button {
                background: linear-gradient(135deg, #EA580C, #DC2626);
                color: white;
                padding: 1rem 2.5rem;
                border: none;
                border-radius: 50px;
                font-size: 1.125rem;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 8px 24px rgba(220, 38, 38, 0.3);
                transition: all 0.3s ease;
            }
            
            .modal-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 32px rgba(220, 38, 38, 0.4);
            }
            
            @keyframes scaleIn {
                from {
                    transform: scale(0.8);
                    opacity: 0;
                }
                to {
                    transform: scale(1);
                    opacity: 1;
                }
            }
            
            @keyframes bounce {
                0%, 100% {
                    transform: translateY(0);
                }
                50% {
                    transform: translateY(-10px);
                }
            }
            
            @media (max-width: 640px) {
                .modal-content {
                    padding: 2rem;
                }
                
                .modal-region {
                    font-size: 2rem;
                }
                
                .modal-icon {
                    font-size: 3rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(modal);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // *** FIX: ADD CLICK LISTENER TO CLOSE MODAL ***
    modal.addEventListener('click', (e) => {
        // Only close if clicking the dark background (modal), not the white box (modal-content)
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = '';
            
            // Reset button state
            isEntering = false;
            buttonText.textContent = 'Start Exploring';
            startButton.disabled = false;
            startButton.style.opacity = '1';
        }
    });
}

// Proceed to map (this would navigate to your map page)
window.proceedToMap = function() {
    const region = regions[selectedRegion];
    
    // Navigate to region-specific page
    console.log(`Navigating to ${region.name}`);
    
    // For Ho Chi Minh City, navigate to hcmc.html
    if (selectedRegion === 'saigon') {
        window.location.href = 'pages/regions/hcmc.html';
    } else {
        // For other regions, show a placeholder message
        alert(`${region.name} is under development! Currently, only the HCM City page is complete. Other pages will be added later.`);
        
        // Remove modal
        const modal = document.querySelector('.welcome-modal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
        
        // Reset state
        isEntering = false;
        buttonText.textContent = 'Start Exploring';
        startButton.disabled = false;
        startButton.style.opacity = '1';
    }
};

// Animate elements on scroll
function animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    // Observe feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        observer.observe(card);
    });
}

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    // Press Enter to start if region is selected
    if (e.key === 'Enter' && selectedRegion && !isEntering) {
        handleStartJourney();
    }
    
    // Press Escape to deselect
    if (e.key === 'Escape' && selectedRegion) {
        const selectedCard = document.querySelector('.region-card.selected');
        if (selectedCard) {
            selectRegion(selectedRegion, selectedCard);
        }
    }
});

// Add loading indicator when images load
document.querySelectorAll('.card-image').forEach(img => {
    img.addEventListener('load', () => {
        img.style.opacity = '1';
    });
    
    img.addEventListener('error', () => {
        // Fallback if image fails to load
        img.style.background = 'linear-gradient(135deg, #E7D5C3, #A89B8D)';
    });
});

// Performance optimization: Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('.card-image').forEach(img => {
        imageObserver.observe(img);
    });
}

// Log analytics (placeholder for future implementation)
function logAnalytics(event, data) {
    console.log('Analytics:', event, data);
    // In production, you would send this to your analytics service
    // Example: gtag('event', event, data);
}

// Track region selection
regionCards.forEach(card => {
    card.addEventListener('click', () => {
        const regionId = card.getAttribute('data-region');
        logAnalytics('region_selected', {
            region: regionId,
            timestamp: new Date().toISOString()
        });
    });
});

console.log('🍜 Culinary Compass Vietnam initialized successfully!');