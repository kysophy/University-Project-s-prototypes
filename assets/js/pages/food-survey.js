// ============================================
// FOOD SURVEY - Question Navigation & Submission
// ============================================

let currentQuestion = 1;
const totalQuestions = 4;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateProgress();
    updateButtons();
    
    // Handle "None" checkbox for dietary restrictions
    const noneCheckbox = document.getElementById('dietary-none');
    const otherDietaryCheckboxes = document.querySelectorAll('input[name="dietary"]:not(#dietary-none)');
    
    if (noneCheckbox) {
        noneCheckbox.addEventListener('change', function() {
            if (this.checked) {
                otherDietaryCheckboxes.forEach(cb => {
                    cb.checked = false;
                });
            }
        });
        
        otherDietaryCheckboxes.forEach(cb => {
            cb.addEventListener('change', function() {
                if (this.checked) {
                    noneCheckbox.checked = false;
                }
            });
        });
    }

    // Handle "None" checkbox for dish-type cravings
    const noneCravingCheckbox = document.getElementById('craving-none');
    const otherCravingCheckboxes = document.querySelectorAll('input[name="craving"]:not(#craving-none)');
    
    if (noneCravingCheckbox) {
        noneCravingCheckbox.addEventListener('change', function() {
            if (this.checked) {
                otherCravingCheckboxes.forEach(cb => {
                    cb.checked = false;
                });
            }
        });

        otherCravingCheckboxes.forEach(cb => {
            cb.addEventListener('change', function() {
                if (this.checked) {
                    noneCravingCheckbox.checked = false;
                }
            });
        });
    }
});

// Change question (next/previous)
function changeQuestion(direction) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.classList.remove('visible');
    
    // Validate current question before moving forward
    if (direction === 1 && !validateCurrentQuestion()) {
        return;
    }
    
    // Hide current question
    const currentSection = document.querySelector('.question-section.active');
    currentSection.classList.remove('active');
    
    // Update question number
    currentQuestion += direction;
    
    // Show new question
    const newSection = document.querySelector(`.question-section[data-question="${currentQuestion}"]`);
    newSection.classList.add('active');
    
    // Update UI
    updateProgress();
    updateButtons();
    
    // Scroll to top of question
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Validate current question
function validateCurrentQuestion() {
    const errorMessage = document.getElementById('errorMessage');
    
    if (currentQuestion === 1) {
        // Question 1: At least one dietary option (or none can be unchecked)
        const dietaryChecked = document.querySelectorAll('input[name="dietary"]:checked');
        if (dietaryChecked.length === 0) {
            showError('Please select at least one dietary option (or "None, I eat everything!")');
            return false;
        }
    } else if (currentQuestion === 2) {
        // Question 2: Must select a vibe
        const vibeChecked = document.querySelector('input[name="vibe"]:checked');
        if (!vibeChecked) {
            showError('Please select a dining experience type');
            return false;
        }
    } else if (currentQuestion === 3) {
        // Question 3: Must select spice level
        const spiceChecked = document.querySelector('input[name="spice"]:checked');
        if (!spiceChecked) {
            showError('Please select your spice tolerance level');
            return false;
        }
    } else if (currentQuestion === 4) {
        // Question 4: At least one craving
        const cravingsChecked = document.querySelectorAll('input[name="craving"]:checked');
        if (cravingsChecked.length === 0) {
            showError('Please select at least one type of food you\'re craving');
            return false;
        }
        
        // If on last question and moving forward, submit the form
        submitSurvey();
        return false; // Prevent normal navigation
    }
    
    return true;
}

// Show error message
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.classList.add('visible');
    
    // Scroll to error
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorMessage.classList.remove('visible');
    }, 5000);
}

// Update progress bar
function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    const percentage = (currentQuestion / totalQuestions) * 100;
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `Question ${currentQuestion} of ${totalQuestions}`;
}

// Update navigation buttons
function updateButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    // Previous button
    if (currentQuestion === 1) {
        prevBtn.disabled = true;
        prevBtn.style.opacity = '0.5';
    } else {
        prevBtn.disabled = false;
        prevBtn.style.opacity = '1';
    }
    
    // Next button text
    if (currentQuestion === totalQuestions) {
        nextBtn.innerHTML = `
            Find Restaurants 🎯
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
        `;
    } else {
        nextBtn.innerHTML = `
            Next
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
        `;
    }
}

// Submit survey and get recommendations
function submitSurvey() {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.classList.remove('visible');
    
    // Collect survey data
    const formData = collectSurveyData();
    
    // Validate we have all required data
    if (!formData.dietary.length || !formData.vibe || !formData.spice || !formData.cravings.length) {
        showError('Please complete all questions before submitting');
        return;
    }
    
    // Show loading state
    showLoadingState();
    
    // Send to backend with timeout
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
    );
    
    const fetchPromise = fetch('http://localhost:5000/api/survey/recommendations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    });
    
    Promise.race([fetchPromise, timeoutPromise])
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Server error');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Survey response:', data);
        
        // Validate response
        if (!data.restaurants || data.restaurants.length === 0) {
            throw new Error('No restaurants found matching your preferences');
        }
        
        // Store results in sessionStorage for the results page
        try {
            sessionStorage.setItem('surveyResults', JSON.stringify({
                preferences: formData,
                restaurants: data.restaurants,
                matchCount: data.count
            }));
        } catch (e) {
            console.error('SessionStorage error:', e);
            // Try with smaller data
            sessionStorage.setItem('surveyResults', JSON.stringify({
                preferences: formData,
                restaurants: data.restaurants.slice(0, 3), // Store only top 3
                matchCount: data.restaurants.length
            }));
        }
        
        // Navigate to results page
        window.location.href = 'survey-results.html';
    })
    .catch(error => {
        console.error('Error submitting survey:', error);
        hideLoadingState();
        
        // Provide specific error messages
        let errorMsg = 'Unable to get recommendations. ';
        if (error.message.includes('timeout')) {
            errorMsg += 'The server is taking too long to respond. Please try again.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMsg += 'Cannot connect to server. Make sure the backend is running (python app.py).';
        } else if (error.message.includes('No restaurants')) {
            errorMsg += 'No restaurants match your exact preferences. Try adjusting your survey answers.';
        } else {
            errorMsg += error.message || 'Please check your connection and try again.';
        }
        
        showError(errorMsg);
    });
}

// Collect all survey data
function collectSurveyData() {
    const data = {
        dietary: [],
        vibe: '',
        spice: '',
        cravings: []
    };
    
    // Dietary restrictions
    const dietaryChecked = document.querySelectorAll('input[name="dietary"]:checked');
    dietaryChecked.forEach(checkbox => {
        data.dietary.push(checkbox.value);
    });
    
    // Dining vibe
    const vibeChecked = document.querySelector('input[name="vibe"]:checked');
    if (vibeChecked) {
        data.vibe = vibeChecked.value;
    }
    
    // Spice tolerance
    const spiceChecked = document.querySelector('input[name="spice"]:checked');
    if (spiceChecked) {
        data.spice = spiceChecked.value;
    }
    
    // Cravings
    const cravingsChecked = document.querySelectorAll('input[name="craving"]:checked');
    cravingsChecked.forEach(checkbox => {
        data.cravings.push(checkbox.value);
    });
    
    return data;
}

// Show loading state
function showLoadingState() {
    const form = document.getElementById('surveyForm');
    
    form.innerHTML = `
        <div class="question-card">
            <div class="loading">
                <div class="loading-spinner"></div>
                <p class="loading-text">Finding the perfect restaurants for you...</p>
            </div>
        </div>
    `;
}

// Hide loading state (restore form)
function hideLoadingState() {
    // Reload the page to restore the form
    location.reload();
}

// Make functions global for onclick handlers
window.changeQuestion = changeQuestion;
window.validateCurrentQuestion = validateCurrentQuestion;

// Analytics tracking (optional)
function trackSurveyProgress() {
    if (window.logAnalytics) {
        window.logAnalytics('survey_question_viewed', {
            question: currentQuestion,
            timestamp: new Date().toISOString()
        });
    }
}

// Log survey completion
function trackSurveyCompletion(data) {
    if (window.logAnalytics) {
        window.logAnalytics('survey_completed', {
            preferences: data,
            timestamp: new Date().toISOString()
        });
    }
}

console.log('🍜 Food Survey initialized!');

