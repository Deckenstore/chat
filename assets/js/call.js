// ===================== CALL.JS =====================

let incomingCall = null;
let isCallActive = false;
let callTimer = null;

// Start a call
async function startCall() {
    if (!callPartnerId) return alert("Select a user first!");
    await startLocalStream();
    createPeerConnection();

    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Save offer to Firebase
    db.ref(`calls/${callPartnerId}/offer`).set({
        from: currentUser.uid,
        offer: offer
    });

    listenForAnswer();
    listenCallEnd();
    updateCallUI("Ringing...");
}

// Firebase auth to get current user for listeners
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;

        // Listen for incoming calls
        db.ref(`calls/${user.uid}/offer`).on("value", async (snap) => {
            if (!snap.exists() || !user) return;

            const data = snap.val();
            incomingCall = data.from;

            if (!isCallActive) {
                const accept = confirm(`Incoming call from ${localStorage.getItem("chatPartnerName")}.\nAccept?`);
                if (accept) await acceptCall();
                else rejectCall();
            }
        });
    }
});

// Accept incoming call
async function acceptCall() {
    await startLocalStream();
    createPeerConnection();

    // Set remote description
    const offerSnap = await db.ref(`calls/${currentUser.uid}/offer`).once("value");
    await peerConnection.setRemoteDescription(offerSnap.val().offer);

    // Create answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Send answer to caller
    db.ref(`calls/${incomingCall}/answer`).set({
        from: currentUser.uid,
        answer: answer
    });

    isCallActive = true;
    startCallTimer();
    updateCallUI("Connected");
}

// Reject incoming call
function rejectCall() {
    db.ref(`calls/${currentUser.uid}`).remove();
    incomingCall = null;
    updateCallUI("Call Rejected");
}

// Listen for answer (caller side)
function listenForAnswer() {
    db.ref(`calls/${currentUser.uid}/answer`).on("value", async (snap) => {
        if (!snap.exists() || isCallActive) return;
        const data = snap.val();
        await peerConnection.setRemoteDescription(data.answer);
        isCallActive = true;
        startCallTimer();
        updateCallUI("Connected");
    });
}

// End call
function endCall() {
    closeCall();
    db.ref(`calls/${currentUser.uid}`).remove();
    db.ref(`calls/${callPartnerId}`).remove();
    db.ref(`calls/${currentUser.uid}/candidates`).remove();
    db.ref(`calls/${callPartnerId}/candidates`).remove();

    stopCallTimer();
    isCallActive = false;
    updateCallUI("Call Ended");
    window.location.href = "home.html"; // or redirect to chat
}

// Mute / Unmute
function toggleMute() {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (track) track.enabled = !track.enabled;
}

// Call timer
function startCallTimer() {
    let seconds = 0;
    callTimer = setInterval(() => {
        seconds++;
        const min = Math.floor(seconds / 60).toString().padStart(2, "0");
        const sec = (seconds % 60).toString().padStart(2, "0");
        updateCallUI(`${min}:${sec}`);
    }, 1000);
}

function stopCallTimer() {
    if (callTimer) {
        clearInterval(callTimer);
        callTimer = null;
    }
}

// Update call UI
function updateCallUI(statusText) {
    const callStatusDiv = document.getElementById("callStatus");
    if (callStatusDiv) callStatusDiv.innerText = statusText;
}
