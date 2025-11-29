// ===================== CHAT.JS =====================

let currentUser = null;
let chatPartnerId = localStorage.getItem("chatPartnerId");
let chatPartnerName = localStorage.getItem("chatPartnerName");

const messagesDiv = document.getElementById("messages");
const userNameDiv = document.getElementById("userName");
const userStatusDiv = document.getElementById("userStatus");
const typingIndicator = document.getElementById("typingIndicator");

// Load partner data and set header
db.ref(`users/${chatPartnerId}`).once("value", (snap) => {
    if (snap.exists()) {
        const data = snap.val();
        chatPartnerName = data.name || data.email || 'Unknown';
        userNameDiv.innerText = chatPartnerName;
        if (document.getElementById("userPhoto")) {
            document.getElementById("userPhoto").src = data.photoUrl || "https://via.placeholder.com/40";
        }
    }
});

// Make name clickable for profile view
userNameDiv.onclick = () => {
    window.location.href = `profile.html?id=${chatPartnerId}`;
};

// Typing indicator variables
let typing = false;
let typingTimeout;

// Check auth state
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        listenMessages();
        listenPartnerStatus();
        listenTyping();
    } else {
        window.location.href = "index.html";
    }
});

// Go back to home
function goBack() {
    window.location.href = "home.html";
}

// Send message
function sendMessage() {
    const msgInput = document.getElementById("msgInput");
    const text = msgInput.value.trim();
    if (!text) return;

    const chatId = generateChatId(currentUser.uid, chatPartnerId);

    const messageData = {
        from: currentUser.uid,
        to: chatPartnerId,
        text: text,
        timestamp: Date.now(),
        seen: false,
    };

    db.ref(`chats/${chatId}`).push(messageData);

    msgInput.value = "";
}

// Generate unique chat ID for 2 users
function generateChatId(uid1, uid2) {
    return uid1 < uid2 ? uid1 + "_" + uid2 : uid2 + "_" + uid1;
}

// Listen for messages
function listenMessages() {
    const chatId = generateChatId(currentUser.uid, chatPartnerId);
    db.ref(`chats/${chatId}`).on("value", (snapshot) => {
        messagesDiv.innerHTML = "";
        snapshot.forEach((childSnap) => {
            const msg = childSnap.val();
            const msgDiv = document.createElement("div");
            msgDiv.className = msg.from === currentUser.uid ? "message me" : "message them";
            const seenStatus = msg.from === currentUser.uid ? (msg.seen ? '✓✓' : '✓') : '';
            msgDiv.innerHTML = `${msg.text}<div class="time">${new Date(msg.timestamp).toLocaleTimeString()}</div><span class="seen-indicator">${seenStatus}</span>`;
            messagesDiv.appendChild(msgDiv);

            // Mark messages as seen
            if (msg.to === currentUser.uid && !msg.seen) {
                childSnap.ref.update({ seen: true });
            }
        });
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

// Listen chat partner online status
function listenPartnerStatus() {
    db.ref(`users/${chatPartnerId}/online`).on("value", (snap) => {
        const online = snap.val();
        if (online) {
            userStatusDiv.innerText = "Online";
        } else {
            // Show last seen
            db.ref(`users/${chatPartnerId}/lastSeen`).once("value", (lsSnap) => {
                const lastSeenVal = lsSnap.val();
                if (lastSeenVal) {
                    userStatusDiv.innerText = "Last seen " + new Date(lastSeenVal).toLocaleString();
                } else {
                    userStatusDiv.innerText = "Offline";
                }
            });
        }
    });
}

// Typing indicator on input
document.getElementById("msgInput").addEventListener('input', () => {
    if (!typing) {
        typing = true;
        sendTyping(true);
    }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        typing = false;
        sendTyping(false);
    }, 1000);
});

// Send typing status
function sendTyping(isTyping) {
    const chatId = generateChatId(currentUser.uid, chatPartnerId);
    if (isTyping) {
        db.ref(`typing/${chatId}`).update({
            [currentUser.uid]: true
        });
    } else {
        db.ref(`typing/${chatId}`).child(currentUser.uid).remove();
    }
}

// Listen for partner's typing
function listenTyping() {
    const chatId = generateChatId(currentUser.uid, chatPartnerId);
    db.ref(`typing/${chatId}/${chatPartnerId}`).on("value", (snap) => {
        if (snap.exists()) {
            typingIndicator.innerText = "Typing...";
        } else {
            typingIndicator.innerText = "";
        }
    });
}
