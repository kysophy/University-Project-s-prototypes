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
            alert('Vui lòng điền đầy đủ thông tin!');
            return;
        }

        if (username.length < 3) {
            alert('Tên đăng nhập phải có ít nhất 3 ký tự!');
            return;
        }

        if (password.length < 6) {
            alert('Mật khẩu phải có ít nhất 6 ký tự!');
            return;
        }

        // Check if username already exists
        if (localStorage.getItem(username)) {
            alert('Tên đăng nhập đã tồn tại! Vui lòng chọn tên khác.');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Email không hợp lệ!');
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
        
        alert('Đăng ký thành công! 🎉\n\nChuyển đến trang đăng nhập...');
        window.location.href = 'signin.html';
    });
} else {
    console.log("Sign Up form not found on this page.");
}

