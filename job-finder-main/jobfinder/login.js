const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
});

// --- AUTHENTICATION LOGIC ---

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    try {
        const res = await fetch('http://localhost:5001/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role: 'student' })
        });
        const data = await res.json();
        
        if (!res.ok) {
            alert("Registration failed: " + (data.message || data.error));
            return;
        }
        
        alert("Registration successful! You can now log in.");
        // Switch to login tab
        container.classList.remove('active');
        document.getElementById('registerForm').reset();
    } catch (err) {
        console.error(err);
        alert("Failed to connect to the backend server.");
    }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch('http://localhost:5001/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (!res.ok) {
            alert("Login failed: " + (data.message || data.error));
            return;
        }
        
        alert("Login successful! Welcome back.");
        localStorage.setItem("userEmail", email);
        // Redirect to main job board
        window.location.href = 'index.html';
    } catch (err) {
        console.error(err);
        alert("Failed to connect to the backend server.");
    }
});