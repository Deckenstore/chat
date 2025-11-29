// firebase-config.js

// 1️⃣ Your Firebase config object
const firebaseConfig = {
  apiKey: "AIzaSyA7VyI58iIDYXxnehoznBJyMvEH8iZf14g",
  authDomain: "chat-3eb1e.firebaseapp.com",
  databaseURL: "https://chat-3eb1e-default-rtdb.firebaseio.com",
  projectId: "chat-3eb1e",
  storageBucket: "chat-3eb1e.firebasestorage.app",
  messagingSenderId: "1074555454144",
  appId: "1:1074555454144:web:15d6bae856ad603fd3e325",
  measurementId: "G-250311H4JY"
};

// 2️⃣ Initialize Firebase
firebase.initializeApp(firebaseConfig);

// 3️⃣ Firebase references
const db = firebase.database();
const auth = firebase.auth();