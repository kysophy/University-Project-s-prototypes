// Sign In Logic
// JWT Mock Generator
function mockGenerateJWT(payload) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.signature`;
}

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
            alert('Tên đăng nhập không tồn tại!');
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
            alert('Đăng nhập thành công! Chào mừng ' + userObj.username + ' 🎉');
            
            // Redirect to home page
            window.location.href = '../index.html';
        } else {
            console.log("Incorrect password");
            alert('Mật khẩu không đúng!');
        }
    });
} else {
    console.log("Sign In form not found on this page.");
}

