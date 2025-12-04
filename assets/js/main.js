/* ============================================
   MAIN GLOBAL JAVASCRIPT
   Shared utilities and functions
   ============================================ */

// Smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';

// Utility Functions
const utils = {
    // Scroll to section
    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    // Show notification
    showNotification(message, duration = 3000) {
        const notification = document.createElement('div');
        notification.className = 'notification-toast';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.4s ease';
            setTimeout(() => notification.remove(), 400);
        }, duration);
    },

    // Get query parameter
    getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },

    // Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Make utils globally available
window.utils = utils;

// Smooth scroll for anchor links
document.addEventListener('DOMContentLoaded', () => {
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
});

// Animate on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements with animation class
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Close any active modals
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        // Close any active dropdowns
        document.querySelectorAll('.dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
});

// Handle image loading errors
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            this.style.background = 'linear-gradient(135deg, #FEF3C7, #FCD34D)';
            this.alt = 'Image not available';
        });
    });
});

// Analytics placeholder
function logAnalytics(event, data) {
    console.log('Analytics:', event, data);
    // In production, send to analytics service
    // Example: gtag('event', event, data);
}

// Make analytics globally available
window.logAnalytics = logAnalytics;

// Log page view
logAnalytics('page_view', {
    page: window.location.pathname,
    timestamp: new Date().toISOString()
});

// Performance monitoring
window.addEventListener('load', () => {
    const loadTime = performance.now();
    console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);
    logAnalytics('page_performance', {
        loadTime: loadTime,
        page: window.location.pathname
    });
});

console.log('🍜 Food Tour Vietnam - Main JS loaded successfully!');

