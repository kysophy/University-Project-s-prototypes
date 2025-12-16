// Sign In Logic
// JWT Mock Generator
function mockGenerateJWT(payload) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.signature`;
}

// Store referrer when this page loads
document.addEventListener('DOMContentLoaded', function() {
    // Store the referrer page for back navigation after signin
    if (!sessionStorage.getItem('previousPage')) {
        // Try document.referrer first
        if (document.referrer && !document.referrer.includes('signin') && !document.referrer.includes('signup')) {
            sessionStorage.setItem('previousPage', document.referrer);
            console.log('Stored previousPage from referrer:', document.referrer);
        } else {
            // Fallback: if coming from hcmc or other region pages without referrer, default to index
            // But we can also check the URL history
            console.log('No valid referrer found');
        }
    }
});

const signinForm = document.getElementById('signinForm');

if (signinForm) {
    console.log("Sign In form found, waiting for submission...");

    signinForm.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log("Sign In button clicked!");

        const usernameInput = document.getElementById('username-login').value.trim();
        const passwordInput = document.getElementById('password-login').value.trim();

        console.log("Attempting login with username:", usernameInput);

        // Check if user exists in localStorage
        const storedUserJSON = localStorage.getItem(usernameInput);

        if (!storedUserJSON) {
            alert('Username does not exist!');
            return;
        }

        const userObj = JSON.parse(storedUserJSON);

        // Verify password
        if (userObj.password === passwordInput) {
            console.log("Password correct!");
            
            // Generate token and save session
            const token = mockGenerateJWT({ username: userObj.username, email: userObj.email });
            localStorage.setItem('accessToken', token);
            localStorage.setItem('currentUser', JSON.stringify(userObj));

            // Show success and redirect
            alert('Sign in successful! Welcome ' + userObj.username + ' 🎉');
            
            // Redirect to previous page or home
            const referrer = sessionStorage.getItem('previousPage');
            if (referrer && !referrer.includes('signin') && !referrer.includes('signup')) {
                window.location.href = referrer;
            } else {
                window.location.href = '../index.html';
            }
        } else {
            console.log("Incorrect password");
            alert('Incorrect password!');
        }
    });
} else {
    console.log("Sign In form not found on this page.");
}

