// ===================== HOME.JS =====================

// Get current user
let currentUser = null;

// Check auth state
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        loadUsers();
        // Update online status
        db.ref("users/" + currentUser.uid).update({
            online: true,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
        // Set offline on disconnect
        db.ref("users/" + currentUser.uid).onDisconnect().update({
            online: false,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
    } else {
        window.location.href = "index.html";
    }
});

// Load all users
function loadUsers() {
    db.ref("users").on("value", (snapshot) => {
        const list = document.getElementById("users-list");
        list.innerHTML = "";
        snapshot.forEach((childSnap) => {
            const uid = childSnap.key;
            const userData = childSnap.val();
            if (uid === currentUser.uid) return; // skip current user

            const userName = userData.name || userData.email || 'User';
            const avatar = userData.photoUrl || 'https://via.placeholder.com/40';
            const div = document.createElement("div");
            div.className = "user-item";
            div.innerHTML = `
                <img src="${avatar}" class="user-avatar">
                <span>${userName}</span>
                <span>${userData.online ? "🟢" : "⚪"}</span>
            `;
            div.onclick = () => openChat(uid, userName);
            list.appendChild(div);
        });
    });
}

// Search users
document.getElementById("searchUser").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    db.ref("users").once("value", (snapshot) => {
        const list = document.getElementById("users-list");
        list.innerHTML = "";
        snapshot.forEach((childSnap) => {
            const uid = childSnap.key;
            const userData = childSnap.val();
            if (uid === currentUser.uid) return;
            const userName = userData.name || userData.email || 'User';
            const avatar = userData.photoUrl || 'https://via.placeholder.com/40';
            if (userName.toLowerCase().includes(query)) {
                const div = document.createElement("div");
                div.className = "user-item";
                div.innerHTML = `
                    <img src="${avatar}" class="user-avatar">
                    <span>${userName}</span>
                    <span>${userData.online ? "🟢" : "⚪"}</span>
                `;
                div.onclick = () => openChat(uid, userName);
                list.appendChild(div);
            }
        });
    });
});

// Open private chat
function openChat(uid, name) {
    localStorage.setItem("chatPartnerId", uid);
    localStorage.setItem("chatPartnerName", name);
    window.location.href = "chat.html";
}
