// script.js

window.addEventListener("load", async () => {
  // Initialize Firebase
  window.initFirebase();

  const auth = window.auth;
  const db = window.db;

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

  const authContainer = document.getElementById("auth-container");
  const signupEmailInput = document.getElementById("signup-email");
  const signupPasswordInput = document.getElementById("signup-password");
  const signupButton = document.getElementById("signup-button");
  const loginEmailInput = document.getElementById("login-email");
  const loginPasswordInput = document.getElementById("login-password");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const userInfoDiv = document.getElementById("user-info");
  const authErrorDiv = document.getElementById("auth-error");
  const mainElement = document.querySelector("main");

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
    const workoutDocRef = window.db.doc(db, "users", uid);
    window.db
      .getDoc(workoutDocRef)
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
    const workoutDocRef = window.db.doc(db, "users", uid);
    window.db.setDoc(workoutDocRef, workoutData);
  }

  function updateAuthUI(user) {
    currentUser = user;
    if (user) {
      authContainer.style.display = "none";
      mainElement.style.display = "block"; // Show workout section
      logoutButton.style.display = "block";
      userInfoDiv.style.display = "block";
      userInfoDiv.textContent = `Logged in as: ${user.email}`;
      loadWorkoutData(user.uid);
    } else {
      authContainer.style.display = "block";
      mainElement.style.display = "none"; // Hide workout section
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

  signupButton.addEventListener("click", async () => {
    if (
      !window.auth ||
      typeof window.auth.createUserWithEmailAndPassword !== "function"
    ) {
      console.error(
        "Firebase Auth object not fully initialized during signup!"
      );
      return;
    }
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;
    try {
      const userCredential = await window.auth.createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      authErrorDiv.textContent = "";
      console.log("Signup successful:", userCredential.user);
    } catch (error) {
      authErrorDiv.textContent = `Sign up failed: ${error.message} (${error.code})`;
      console.error("Signup error:", error);
    }
  });

  loginButton.addEventListener("click", async () => {
    if (
      !window.auth ||
      typeof window.auth.signInWithEmailAndPassword !== "function"
    ) {
      console.error("Firebase Auth object not fully initialized during login!");
      return;
    }
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    try {
      const userCredential = await window.auth.signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      authErrorDiv.textContent = "";
      console.log("Login successful:", userCredential.user);
    } catch (error) {
      authErrorDiv.textContent = `Login failed: ${error.message} (${error.code})`;
      console.error("Login error:", error);
    }
  });

  logoutButton.addEventListener("click", () => {
    if (window.auth && typeof window.auth.signOut === "function") {
      window.auth.signOut(auth);
    } else {
      console.error(
        "Firebase Auth object not fully initialized during logout!"
      );
    }
  });

  // Attach onAuthStateChanged only if window.auth is available
  if (window.auth && typeof window.auth.onAuthStateChanged === "function") {
    window.auth.onAuthStateChanged(auth, (user) => {
      updateAuthUI(user);
    });
  } else {
    console.error(
      "Firebase Auth object not fully initialized for onAuthStateChanged!"
    );
  }

  updateDisplay(); // Initial display
});
