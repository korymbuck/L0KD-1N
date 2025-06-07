import * as DOM from "./domElements.js";
import * as Auth from "./auth.js";
import * as UI from "./ui.js";
import * as Workouts from "./workouts.js";

UI.styleControls();
UI.updateAuthFormUI(false);

if (DOM.loginButton) {
  DOM.loginButton.addEventListener("click", async () => {
    console.log("Login button clicked"); // <-- ADD THIS
    const email = DOM.loginEmailInput.value.trim();
    const password = DOM.loginPasswordInput.value.trim();
    console.log("Attempting login with:", { email, password }); // <-- ADD THIS
    await Auth.signInUser(email, password);
    console.log("Auth.signInUser call completed in main.js"); // <-- ADD THIS
  });
}

if (DOM.signupButton) {
  DOM.signupButton.addEventListener("click", async () => {
    console.log("Signup button clicked"); // <-- ADD THIS
    const email = DOM.signupEmailInput.value.trim();
    const password = DOM.signupPasswordInput.value.trim();
    const username = DOM.signupUsernameInput.value.trim();
    console.log("Attempting signup with:", { email, password, username }); // <-- ADD THIS
    const result = await Auth.signUpUser(email, password, username);
    console.log("Auth.signUpUser call completed in main.js, result:", result); // <-- ADD THIS
    if (!result.success && result.error?.message === "Username taken") {
      if (DOM.signupUsernameInput) DOM.signupUsernameInput.focus();
    }
  });
}

if (DOM.logoutButton) {
  DOM.logoutButton.addEventListener("click", async () => {
    await Auth.signOutUser();
  });
}

if (DOM.authToggle) {
  let showingSignup = false;
  DOM.authToggle.addEventListener("click", () => {
    showingSignup = !showingSignup;
    UI.updateAuthFormUI(showingSignup);
  });
}

if (DOM.workoutButtons) {
  DOM.workoutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const increment = parseInt(button.dataset.increment);
      const workout = button.dataset.workout;
      await Workouts.handleWorkoutIncrement(workout, increment);
    });
  });
}

Auth.initializeAuth();
