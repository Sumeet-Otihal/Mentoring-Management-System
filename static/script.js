document.addEventListener('DOMContentLoaded', function() {
    const roleSelect = document.getElementById('role');
    const branchGroup = document.getElementById('branch-group');
    const usernameLabel = document.getElementById('usernameLabel');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');
    const roleError = document.getElementById('roleError');
    const generalError = document.getElementById('generalError');
    const clearButton = document.getElementById('clearButton');

    // Show/Hide branch dropdown and change label based on role selection
   roleSelect.addEventListener('change', function() {
    if (this.value === 'student') {
        branchGroup.style.display = 'none';
        usernameLabel.textContent = 'USN';
        usernameInput.placeholder = 'Enter your USN';
    } else {
        branchGroup.style.display = 'none';
        usernameLabel.textContent = 'Username';
        usernameInput.placeholder = 'Enter your username';
    }
});
    // Enhanced Validation with Inline Error Messages
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        let hasError = false;
        usernameError.textContent = '';
        passwordError.textContent = '';
        roleError.textContent = '';
        generalError.textContent = '';

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const role = roleSelect.value.toUpperCase(); // Convert role to uppercase for the backend
    
        // Debugging logs to see password and role values
        console.log("Password entered:", password);
        console.log("Role entered:", role);
    
        // Username validation
        if (username === '') {
            usernameError.textContent = 'Username is required.';
            usernameError.style.display = 'block';
            hasError = true;
        }
    
        // Password validation
        if (password === '') {
            passwordError.textContent = 'Password is required.';
            passwordError.style.display = 'block';
            hasError = true;
        } else {
            console.log("Password length:", password.length);
            console.log("Password has uppercase:", /[A-Z]/.test(password));
            console.log("Password has number:", /[0-9]/.test(password));
    
            if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
                passwordError.textContent = 'Password must be at least 8 characters long, with at least one uppercase letter and one number.';
                passwordError.style.display = 'block';
                hasError = true;
            }
        }
    
        // Role validation
        if (role === '') {
            roleError.textContent = 'Please select a role.';
            roleError.style.display = 'block';
            hasError = true;
        }
    
        // Proceed only if no errors
        if (!hasError) {
            fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role })
            })
            .then(response => {
                // Check if response is OK (status code in the 2xx range)
                if (response.ok) {
                    return response.json();
                } else if (response.status === 401) {
                    // If status is 401, handle invalid credentials
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Invalid credentials');
                    });
                } else {
                    // Handle other types of errors, like 500 server errors
                    throw new Error("An unexpected error occurred. Please try again.");
                }
            })
            .then(data => {
                if (data.success) {
                    sessionStorage.setItem('userRole', data.role);
                    // Redirect if login is successful
                    alert("Login Successfull!!");
                    window.location.href = data.redirect;
                }
            })
            .catch(error => {
                // Display the appropriate error message based on the error
                if (error.message === 'Invalid credentials') {
                    //usernameError.textContent = "Invalid username";
                    //passwordError.textContent = "Invalid password";
                    usernameError.style.display = 'block';
                    passwordError.style.display = 'block';
                    generalError.textContent = "Invalid username or password.";
                    generalError.style.display = 'block';
                    generalError.style.textAlign = 'center';
                    generalError.style.width = '100%';
                    generalError.style.margin = '10px auto 0';
                } else {
                    // Display a general error message for other errors
                    alert(error.message);
                }
            });
            
        }
    });

    clearButton.addEventListener('click', function() {
        usernameInput.value = '';
        passwordInput.value = '';
        roleSelect.selectedIndex = 0;
        branchGroup.style.display = 'none';
        usernameLabel.textContent = 'Username';
        usernameInput.placeholder = 'Enter your username';
        usernameError.textContent = '';
        passwordError.textContent = '';
        roleError.textContent = '';
        generalError.textContent = '';
        generalError.style.display = 'none';
        generalError.style.marginTop = '0px';
    });
});
