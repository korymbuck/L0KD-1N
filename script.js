// script.js

// Import Firebase modules
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGbbXg4iUI-LAGFNeX79q2UIyDqumx7fc",
  authDomain: "l0kd-1n.firebaseapp.com",
  projectId: "l0kd-1n",
  storageBucket: "l0kd-1n.firebasestorage.app",
  messagingSenderId: "76980580168",
  appId: "1:76980580168:web:cef32b7c744d3f5ce90d7d",
  measurementId: "G-RW34CML9M1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Get references to HTML elements
const pushupsCount = document.getElementById("pushups-count");
const squatsCount = document.getElementById("squats-count");
const situpsCount = document.getElementById("situps-count");
const workoutButtons = document.querySelectorAll(
  ".workout button[data-increment]"
);
const allTimePushups = document.getElementById("all-time-pushups");
const allTimeSquats = document.getElementById("all-time-squats");
const allTimeSitups = document.getElementById("all-time-situps");

const authContainer = document.createElement("div");
authContainer.id = "auth-container";
authContainer.innerHTML = `
  <h2>Sign Up</h2>
  <input type="email" id="signup-email" placeholder="Email">
  <input type="password" id="signup-password" placeholder="Password">
  <button id="signup-button">Sign Up</button>

  <h2>Login</h2>
  <input type="email" id="login-email" placeholder="Email">
  <input type="password" id="login-password" placeholder="Password">
  <button id="login-button">Login</button>

  <button id="logout-button" style="display:none;">Logout</button>
  <div id="user-info" style="display:none;"></div>
  <div id="auth-error" style="color:red;"></div>
`;

const mainElement = document.querySelector("main");
mainElement.prepend(authContainer); // Add auth container at the beginning of main

const signupEmailInput = document.getElementById("signup-email");
const signupPasswordInput = document.getElementById("signup-password");
const signupButton = document.getElementById("signup-button");
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const loginButton = document.getElementById("login-button");
const logoutButton = document.getElementById("logout-button");
const userInfoDiv = document.getElementById("user-info");
const authErrorDiv = document.getElementById("auth-error");

let currentUser = null;
let workoutData = {
  pushups: 0,
  squats: 0,
  situps: 0,
  allTimePushups: 0,
  allTimeSquats: 0,
  allTimeSitups: 0,
};

function updateDisplay() {
  pushupsCount.textContent = workoutData.pushups;
  squatsCount.textContent = workoutData.squats;
  situpsCount.textContent = workoutData.situps;
  allTimePushups.textContent = workoutData.allTimePushups;
  allTimeSquats.textContent = workoutData.allTimeSquats;
  allTimeSitups.textContent = workoutData.allTimeSitups;
}

function loadWorkoutData(uid) {
  const workoutDocRef = doc(db, "users", uid);
  getDoc(workoutDocRef)
    .then((docSnapshot) => {
      if (docSnapshot.exists()) {
        workoutData = docSnapshot.data();
        updateDisplay();
      } else {
        console.log(
          "No workout data found for user:",
          uid,
          ". Starting fresh."
        );
        workoutData = {
          pushups: 0,
          squats: 0,
          situps: 0,
          allTimePushups: 0,
          allTimeSquats: 0,
          allTimeSitups: 0,
        };
        updateDisplay();
        saveWorkoutData(uid);
      }
    })
    .catch((error) => {
      console.error("Error loading workout data:", error);
    });
}

function saveWorkoutData(uid) {
  if (!uid) {
    console.error("Cannot save data: User not logged in.");
    return;
  }
  const workoutDocRef = doc(db, "users", uid);
  setDoc(workoutDocRef, workoutData);
}

function updateAuthUI(user) {
  currentUser = user;
  if (user) {
    authContainer.style.display = "none";
    document.querySelector("main").style.display = "block"; // Show workout section
    logoutButton.style.display = "block";
    userInfoDiv.style.display = "block";
    userInfoDiv.textContent = `Logged in as: ${user.email}`;
    loadWorkoutData(user.uid);
  } else {
    authContainer.style.display = "block";
    document.querySelector("main").style.display = "none"; // Hide workout section
    logoutButton.style.display = "none";
    userInfoDiv.style.display = "none";
    workoutData = {
      pushups: 0,
      squats: 0,
      situps: 0,
      allTimePushups: 0,
      allTimeSquats: 0,
      allTimeSitups: 0,
    };
    updateDisplay();
  }
}

signupButton.addEventListener("click", () => {
  const email = signupEmailInput.value;
  const password = signupPasswordInput.value;
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      authErrorDiv.textContent = "";
    })
    .catch((error) => {
      authErrorDiv.textContent = `Sign up failed: ${error.message} (${error.code})`;
    });
});

loginButton.addEventListener("click", () => {
  const email = loginEmailInput.value;
  const password = loginPasswordInput.value;
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      authErrorDiv.textContent = "";
    })
    .catch((error) => {
      authErrorDiv.textContent = `Login failed: ${error.message} (${error.code})`;
    });
});

logoutButton.addEventListener("click", () => {
  signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  updateAuthUI(user);
});

workoutButtons.forEach((button) => {
  button.addEventListener("click", function () {
    const increment = parseInt(this.dataset.increment);
    const workout = this.dataset.workout;
    if (currentUser) {
      workoutData[workout] += increment;
      workoutData[
        `allTime${workout.charAt(0).toUpperCase() + workout.slice(1)}`
      ] += increment;
      updateDisplay();
      saveWorkoutData(currentUser.uid);
    } else {
      alert("Please log in to save your progress.");
    }
  });
});

updateDisplay(); // Initial display
