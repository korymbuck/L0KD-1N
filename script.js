// script.js

document.addEventListener("DOMContentLoaded", () => {
  const authContainer = document.getElementById("auth-container");
  const signupButton = document.getElementById("signup-button");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const userInfoDiv = document.getElementById("user-info");
  const authErrorDiv = document.getElementById("auth-error");
  const mainElement = document.querySelector("main");

  const pushupsCount = document.getElementById("pushups-count");
  const squatsCount = document.getElementById("squats-count");
  const situpsCount = document.getElementById("situps-count");
  const allTimePushups = document.getElementById("all-time-pushups");
  const allTimeSquats = document.getElementById("all-time-squats");
  const allTimeSitups = document.getElementById("all-time-situps");
  const workoutButtons = document.querySelectorAll(
    ".workout button[data-increment]"
  );

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

  function loadWorkoutData(user) {
    if (user) {
      const userId = user.id; // Netlify Identity user ID
      // In a real application, you would fetch user-specific workout data
      // from a database using this userId. For this example, we'll just
      // reset the local workout data.
      workoutData = {
        pushups: 0,
        squats: 0,
        situps: 0,
        allTimePushups: 0,
        allTimeSquats: 0,
        allTimeSitups: 0,
      };
      updateDisplay();
      console.log("Workout data loaded (placeholder) for user:", user);
    } else {
      // Reset workout data if no user is logged in
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

  function updateAuthUI(user) {
    currentUser = user;
    if (user) {
      authContainer.style.display = "none";
      mainElement.style.display = "block";
      logoutButton.style.display = "block";
      userInfoDiv.style.display = "block";
      userInfoDiv.textContent = `Logged in as: ${user.email || "User"}`;
      loadWorkoutData(user);
    } else {
      authContainer.style.display = "block";
      mainElement.style.display = "none";
      logoutButton.style.display = "none";
      userInfoDiv.style.display = "none";
      loadWorkoutData(null);
    }
  }

  window.netlifyIdentity.on("init", (user) => {
    updateAuthUI(user);
  });

  window.netlifyIdentity.on("login", (user) => {
    updateAuthUI(user);
  });

  window.netlifyIdentity.on("logout", () => {
    updateAuthUI(null);
  });

  signupButton.addEventListener("click", () => {
    window.netlifyIdentity.open("signup");
  });

  loginButton.addEventListener("click", () => {
    window.netlifyIdentity.open("login");
  });

  logoutButton.addEventListener("click", () => {
    window.netlifyIdentity.logout();
  });

  workoutButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const increment = parseInt(this.dataset.increment);
      const workout = this.dataset.workout;
      workoutData[workout] += increment;
      workoutData[
        `allTime${workout.charAt(0).toUpperCase() + workout.slice(1)}`
      ] += increment;
      updateDisplay();
      if (currentUser) {
        // In a real application, you would save this workout data
        // to a database associated with the currentUser.id.
        console.log("Workout data updated for user:", currentUser);
      } else {
        alert("Please log in to save your progress.");
      }
    });
  });

  updateDisplay(); // Initial display
});
