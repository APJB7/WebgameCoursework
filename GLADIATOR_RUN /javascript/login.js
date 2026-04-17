
// Function to handle Sign Up
function signUp(event) {
    
    event.preventDefault();

    const userName = document.getElementById('signUpUsername').value.trim();
    const email = document.getElementById('signUpEmail').value.trim();
    const password = document.getElementById('signUpPassword').value;
    const phone = document.getElementById('phoneNumber').value.trim();
    const address = document.getElementById('address').value.trim();

    // use of regex to validate my data
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    const phoneRegex = /^[0-9]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!passwordRegex.test(password)) {
        alert("Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one digit.");
        return;
    }

    if (!phoneRegex.test(phone)) {
        alert("Your phone number should only consist of numeric values only")
        return
    }

    if (!emailRegex.test(email)) {
        alert("Your email should consist of the correct email format")
        return
    }

    // Check if the username already exists
    if (localStorage.getItem(userName)) {
        alert("Username already exists. Please choose another username");
        return;
    }

    // Check if the username already exists
    if (localStorage.getItem(email)) {
        alert("Email already exists. Please choose a different email");
        return;
    }

    // Create user object
    const newUser = {
        userName: userName,
        email: email,
        password: password,
        phone: phone,
        address: address
    };

    // Store user data in local storage under the username as the key
    localStorage.setItem(userName, JSON.stringify(newUser));

    alert("You are signed up! Go to the log in.");
    document.getElementById("signupForm").reset();
}

// Function to handle Login
function login(event) {
    event.preventDefault();
    const loginUser = document.getElementById('loginUser').value.trim();
    const loginPassword = document.getElementById('loginPassword').value;

    const userData = localStorage.getItem(loginUser);

    if (userData) {
        const user = JSON.parse(userData);

        if (user.password === loginPassword) {
            alert("Login successful!");
            localStorage.setItem("loggedInUser", loginUser); // Store username in localStorage
            window.location.href = "webpage.html";

        } else {
            alert("Invalid password! Please try again.");
        }
    } else {
        alert("Invalid username or password! Please try again.");
    }
}


function play() {
    window.location.href = "index.html";
}


