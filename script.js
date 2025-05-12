import supabase from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

document.addEventListener("DOMContentLoaded", () => {
  const supabaseUrl = "https://nglasnytfnyavhsxjuau.supabase.co"; // Replace with your Supabase URL
  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nbGFzbnl0Zm55YXZoc3hqdWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MTg4OTQsImV4cCI6MjA2MjM5NDg5NH0.tIDB4uS0jYojQmWRG2EnrxXss3PhcWbFCnVF4_j4dzw"; // Replace with your Supabase Anon Key
  const { createClient } = supabase; // Destructure createClient from the supabase object
  const supabaseClient = createClient(supabaseUrl, supabaseKey);

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
    /* ... initial workout data ... */
  };

  function updateDisplay() {
    /* ... your updateDisplay function ... */
  }

  async function loadWorkoutData(userId) {
    /* ... your loadWorkoutData function ... */
  }

  async function saveWorkoutData(userId, data) {
    /* ... your saveWorkoutData function ... */
  }

  function updateAuthUI(user) {
    /* ... your updateAuthUI function ... */
  }

  signupButton.addEventListener("click", async () => {
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
      authErrorDiv.textContent = `Sign up failed: ${error.message}`;
      console.error("Sign up error:", error);
    } else {
      authErrorDiv.textContent =
        "Sign up successful! Check your email to confirm.";
      console.log("Sign up successful!");
    }
  });

  loginButton.addEventListener("click", async () => {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      authErrorDiv.textContent = `Login failed: ${error.message}`;
      console.error("Login error:", error);
    } else {
      console.log("Login successful:", data);
    }
  });

  logoutButton.addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
    } else {
      console.log("Logged out");
    }
  });

  supabaseClient.auth.onAuthStateChange((event, session) => {
    updateAuthUI(session?.user);
  });

  workoutButtons.forEach((button) => {
    /* ... your workout button logic ... */
  });

  supabaseClient.auth.getSession().then(({ data: { session } }) => {
    updateAuthUI(session?.user);
  });

  updateDisplay(); // Initial display
});
