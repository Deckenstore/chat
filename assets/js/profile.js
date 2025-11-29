// ===================== PROFILE.JS =====================

let currentUser = null;
let profileUserId = null; // if viewing other user's profile

// Check auth and load profile
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;

        // Check if viewing own profile or another user's
        const urlParams = new URLSearchParams(window.location.search);
        profileUserId = urlParams.get('id') || user.uid;

        loadProfile();
    } else {
        window.location.href = "index.html";
    }
});

// Load profile data
function loadProfile() {
    db.ref(`users/${profileUserId}`).once("value", (snap) => {
        if (snap.exists()) {
            const userData = snap.val();
            document.getElementById("profileName").value = userData.name || "";
            document.getElementById("profileDesc").value = userData.description || "";
            document.getElementById("profilePhotoUrl").value = userData.photoUrl || "";
            document.getElementById("profilePhoto").src = userData.photoUrl || "https://via.placeholder.com/100";

            if (profileUserId !== currentUser.uid) {
                // Viewing another user's profile - hide form
                document.getElementById("profileForm").style.display = "none";
                document.querySelector("h2").innerText = `${userData.name || 'User'}'s Profile`;
                return;
            } else {
                document.querySelector("h2").innerText = "My Profile";
            }
        }
    });
}

// Update profile
document.getElementById("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("profileName").value.trim();
    const desc = document.getElementById("profileDesc").value.trim();
    const photoUrl = document.getElementById("profilePhotoUrl").value.trim();

    if (!name) return alert("Name is required!");

    const updates = {};
    if (name) updates.name = name;
    if (desc) updates.description = desc;
    if (photoUrl) updates.photoUrl = photoUrl;

    db.ref(`users/${currentUser.uid}`).update(updates)
        .then(() => {
            alert("Profile updated!");
            document.getElementById("profilePhoto").src = photoUrl || "https://via.placeholder.com/100";
        })
        .catch((err) => alert("Error updating profile: " + err.message));
});
