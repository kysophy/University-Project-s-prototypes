// Profile Page Logic
// JWT Mock Generator
function mockGenerateJWT(payload) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.newsignature`;
}

// Go back to previous page or home
function goBack() {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // If no history, go to home
        window.location.href = '../index.html';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!token || !currentUser) {
        alert('You are not logged in!');
        window.location.href = 'signin.html';
        return;
    }

    // Get DOM elements
    const usernameInput = document.getElementById('username-input');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const passwordRow = document.getElementById('password-row');
    const avatarCircle = document.querySelector('.avatar-circle');
    
    const editBtn = document.getElementById('edit-btn');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const actionButtons = document.getElementById('action-buttons');
    const logoutBtn = document.querySelector('.logout-btn');

    // Render user data
    function renderData() {
        const storedUser = JSON.parse(localStorage.getItem(currentUser.username));
        
        if (storedUser) {
            usernameInput.value = storedUser.username;
            emailInput.value = storedUser.email;
            avatarCircle.innerText = storedUser.username.charAt(0).toUpperCase();
            passwordInput.value = "";
            
            // Update dates
            if (storedUser.createdAt) {
                const createdDate = new Date(storedUser.createdAt).toLocaleDateString('vi-VN');
                document.getElementById('created-date').textContent = createdDate;
            }
            
            const updatedDate = new Date().toLocaleDateString('vi-VN');
            document.getElementById('updated-date').textContent = updatedDate;
        }
    }

    // Initial render
    renderData();

    // Edit button handler
    editBtn.addEventListener('click', function() {
        usernameInput.disabled = false;
        emailInput.disabled = false;
        passwordRow.style.display = 'block';
        actionButtons.style.display = 'flex';
        editBtn.style.display = 'none';
    });

    // Cancel button handler
    cancelBtn.addEventListener('click', function() {
        usernameInput.disabled = true;
        emailInput.disabled = true;
        passwordRow.style.display = 'none';
        actionButtons.style.display = 'none';
        editBtn.style.display = 'block';
        renderData();
    });

    // Save button handler
    saveBtn.addEventListener('click', function() {
        const oldUsername = currentUser.username;
        const newUsername = usernameInput.value.trim();
        const newEmail = emailInput.value.trim();
        const newPassword = passwordInput.value.trim();

        // Validation
        if (!newUsername || !newEmail) {
            alert("Username and Email cannot be empty!");
            return;
        }

        if (newUsername.length < 3) {
            alert("Username must be at least 3 characters!");
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            alert('Invalid email!');
            return;
        }

        // Get user data from storage
        let userData = JSON.parse(localStorage.getItem(oldUsername));

        // If username changed, check if new username is available
        if (newUsername !== oldUsername) {
            if (localStorage.getItem(newUsername)) {
                alert("New username is already taken! Please choose another name.");
                return;
            }

            // Remove old username entry
            localStorage.removeItem(oldUsername);
            
            // Update username
            userData.username = newUsername;
        }

        // Update email
        userData.email = newEmail;
        
        // Update password if provided
        if (newPassword) {
            if (newPassword.length < 6) {
                alert("Password must be at least 6 characters!");
                return;
            }
            userData.password = newPassword;
        }

        // Save to storage
        localStorage.setItem(userData.username, JSON.stringify(userData));

        // Update session
        currentUser = userData;
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Generate new token
        const newToken = mockGenerateJWT({ 
            username: userData.username, 
            email: userData.email 
        });
        localStorage.setItem('accessToken', newToken);

        // Success
        alert("Profile updated successfully! ✅");
        
        // Return to view mode
        cancelBtn.click();
        renderData();
    });

    // Logout button handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            handleLogout();
        });
    }
});

// Global logout function (can be called from onclick)
function handleLogout() {
    if (confirm('Are you sure you want to sign out?')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'signin.html';
    }
}

