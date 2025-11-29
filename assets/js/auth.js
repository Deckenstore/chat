// ===================== AUTH.JS =====================

// Check if user is already logged in (only on login page)
if (window.location.pathname.endsWith('index.html')) {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // User logged in, redirect to home
            window.location.href = "home.html";
        }
    });
}
// Show Register form
function showRegister() {
    document.getElementById("login-box").classList.add("hidden");
    document.getElementById("register-box").classList.remove("hidden");
}

// Show Login form
function showLogin() {
    document.getElementById("register-box").classList.add("hidden");
    document.getElementById("login-box").classList.remove("hidden");
}

// Register User
function registerUser() {
    console.log("Register function called");
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-pass").value;

    if (!name || !email || !password) return alert("Enter all fields!");

    auth.createUserWithEmailAndPassword(email, password)
        .then((cred) => {
            console.log("User created:", cred.user.uid);
            const uid = cred.user.uid;
            // Save user info in Realtime DB
            return db.ref("users/" + uid).set({
                name: name,
                email: email,
                online: true,
                lastSeen: firebase.database.ServerValue.TIMESTAMP,
            });
        })
        .then(() => {
            console.log("DB saved, redirecting");
            // Redirect to home after successful db save
            window.location.href = "home.html";
        })
        .catch((err) => {
            console.error("Error:", err);
            alert(err.message);
        });
}

// Login User
function loginUser() {
    console.log("Login function called");
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-pass").value;

    if (!email || !password) return alert("Enter email and password!");

    auth.signInWithEmailAndPassword(email, password)
        .then((cred) => {
            console.log("User logged in:", cred.user.uid);
            const uid = cred.user.uid;
            db.ref("users/" + uid).update({
                online: true,
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
            window.location.href = "home.html";
        })
        .catch((err) => {
            console.error("Login error:", err);
            alert(err.message);
        });
}

// Logout User
function logoutUser() {
    const user = auth.currentUser;
    if (user) {
        db.ref("users/" + user.uid).update({
            online: false,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
    }
    auth.signOut().then(() => {
        window.location.href = "index.html";
    });
}
