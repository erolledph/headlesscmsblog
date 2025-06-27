// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDmZWww42jGrI013LciR-Gjr7Bcj6dNJ9g",
  authDomain: "ectawks.firebaseapp.com",
  projectId: "ectawks",
  storageBucket: "ectawks.firebasestorage.app",
  messagingSenderId: "636646251239",
  appId: "1:636646251239:web:e4e14b65d9712f2d712042"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Export for use in other files
window.firebaseServices = {
  auth,
  db,
  storage
};