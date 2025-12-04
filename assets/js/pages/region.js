// ============================================
// REGION PAGE - Ho Chi Minh City
// Authentication is handled by auth.js
// ============================================

// Region-specific navigation functions
function navigateToSearch(dishFilter = '') {
    if (dishFilter) {
        window.location.href = `../features/search.html?dish=${dishFilter}`;
    } else {
        window.location.href = '../features/search.html';
    }
}

// Scroll to section function
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ============================================
// CULINARY STORIES SCROLL FUNCTIONALITY
// ============================================
const storiesContainer = document.getElementById('storiesContainer');
const paginationDots = document.querySelectorAll('.pagination-dot');
const prevBtn = document.getElementById('storyPrev');
const nextBtn = document.getElementById('storyNext');
let currentStoryIndex = 0;
const totalStories = document.querySelectorAll('.story-slide').length;

// Navigate to specific story
function goToStory(index) {
    if (index < 0) index = 0;
    if (index >= totalStories) index = totalStories - 1;
    
    currentStoryIndex = index;
    
    if (storiesContainer) {
        const slideWidth = storiesContainer.offsetWidth;
        storiesContainer.scrollTo({
            left: slideWidth * index,
            behavior: 'smooth'
        });
    }
    
    updatePaginationDots();
    updateNavArrows();
}

// Update pagination dots
function updatePaginationDots() {
    paginationDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentStoryIndex);
    });
}

// Update navigation arrows visibility
function updateNavArrows() {
    if (prevBtn) {
        prevBtn.style.opacity = currentStoryIndex === 0 ? '0.4' : '1';
        prevBtn.style.pointerEvents = currentStoryIndex === 0 ? 'none' : 'auto';
    }
    if (nextBtn) {
        nextBtn.style.opacity = currentStoryIndex === totalStories - 1 ? '0.4' : '1';
        nextBtn.style.pointerEvents = currentStoryIndex === totalStories - 1 ? 'none' : 'auto';
    }
}

// Add event listeners for pagination dots
paginationDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        goToStory(index);
    });
});

// Add event listeners for navigation arrows
if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        goToStory(currentStoryIndex - 1);
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        goToStory(currentStoryIndex + 1);
    });
}

// Handle scroll snap - update dots when scrolling manually
if (storiesContainer) {
    let scrollTimeout;
    storiesContainer.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const slideWidth = storiesContainer.offsetWidth;
            const newIndex = Math.round(storiesContainer.scrollLeft / slideWidth);
            if (newIndex !== currentStoryIndex) {
                currentStoryIndex = newIndex;
                updatePaginationDots();
                updateNavArrows();
            }
        }, 100);
    });
}

// Keyboard navigation for stories
document.addEventListener('keydown', (e) => {
    // Only handle if stories section is in view
    const storiesSection = document.getElementById('bulletin');
    if (!storiesSection) return;
    
    const rect = storiesSection.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    
    if (inView) {
        if (e.key === 'ArrowLeft') {
            goToStory(currentStoryIndex - 1);
        } else if (e.key === 'ArrowRight') {
            goToStory(currentStoryIndex + 1);
        }
    }
});

// Touch swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

if (storiesContainer) {
    storiesContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    storiesContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
}

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swiped left - next story
            goToStory(currentStoryIndex + 1);
        } else {
            // Swiped right - previous story
            goToStory(currentStoryIndex - 1);
        }
    }
}

// Initialize navigation arrows state
updateNavArrows();

// Animate story cards on scroll into view
const storyObserverOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
};

const storyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, storyObserverOptions);

// Observe story slides
document.querySelectorAll('.story-slide').forEach(slide => {
    storyObserver.observe(slide);
});

// Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Handle navigation active state
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// Log analytics (placeholder)
function logAnalytics(event, data) {
    console.log('Analytics:', event, data);
    // In production: send to analytics service
}

// Track page view
logAnalytics('page_view', {
    page: 'hcmc',
    timestamp: new Date().toISOString()
});

// Add loading state for story images
document.querySelectorAll('.story-image').forEach(img => {
    img.addEventListener('load', () => {
        img.style.opacity = '1';
    });
    
    img.addEventListener('error', () => {
        img.closest('.story-image-wrapper').style.background = 'linear-gradient(135deg, #FEF3C7, #FCD34D)';
    });
});

// Chatbot functionality (placeholder)
document.querySelector('.chatbot-button')?.addEventListener('click', () => {
    alert('Chatbot functionality will be implemented here!\n\nFeatures:\n- Ask about dishes\n- Get restaurant recommendations\n- Find directions\n- Food allergies info');
    logAnalytics('chatbot_opened', {});
});

// Add entrance animation delay
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// Export functions to global scope for inline onclick handlers
window.scrollToSection = scrollToSection;
window.navigateToSearch = navigateToSearch;

console.log('🍜 Food Tour HCMC initialized successfully!');

