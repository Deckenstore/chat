// ===================== WEBRTC.JS =====================

let localStream = null;
let peerConnection = null;
let currentUser = null;
let callPartnerId = localStorage.getItem("chatPartnerId");

// STUN servers
const iceServers = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ]
};

// Get current user
firebase.auth().onAuthStateChanged((user) => {
    if (user) currentUser = user;
});

// Start local audio and video
async function startLocalStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const localVideo = document.getElementById("localVideo");
        if (localVideo) {
            localVideo.srcObject = localStream;
        }
    } catch (err) {
        if (err.name === "NotAllowedError") {
            alert("Camera and microphone access denied!");
        } else {
            alert("Failed to access media devices!");
        }
        console.error(err);
    }
}

// Create Peer Connection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(iceServers);

    // Add local tracks
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Remote stream
    peerConnection.ontrack = (event) => {
        const remoteVideo = document.getElementById("remoteVideo");
        if (remoteVideo) {
            remoteVideo.srcObject = event.streams[0];
        }
    };

    // ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            db.ref(`calls/${callPartnerId}/candidates`).push(event.candidate.toJSON());
        }
    };

    // Listen for remote ICE candidates
    db.ref(`calls/${currentUser.uid}/candidates`).on("child_added", (snap) => {
        const candidate = new RTCIceCandidate(snap.val());
        peerConnection.addIceCandidate(candidate);
    });
}

// Clean up call
function closeCall() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    const localVideo = document.getElementById("localVideo");
    const remoteVideo = document.getElementById("remoteVideo");
    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) remoteVideo.srcObject = null;
}
