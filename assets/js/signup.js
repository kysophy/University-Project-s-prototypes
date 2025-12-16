// Sign Up Logic
const signupForm = document.getElementById('signupForm');

if (signupForm) {
    console.log("Sign Up form found, waiting for submission...");

    signupForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        // Validation
        if (!username || !email || !password) {
            alert('Please fill in all information!');
            return;
        }

        if (username.length < 3) {
            alert('Username must be at least 3 characters!');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters!');
            return;
        }

        // Check if username already exists
        if (localStorage.getItem(username)) {
            alert('Username already exists! Please choose another name.');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Invalid email!');
            return;
        }

        // Create new user
        const newUser = { 
            username, 
            email, 
            password,
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem(username, JSON.stringify(newUser));
        
        alert('Sign up successful! 🎉\n\nRedirecting to sign in page...');
        window.location.href = 'signin.html';
    });
} else {
    console.log("Sign Up form not found on this page.");
}

