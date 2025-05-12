import * as supabaseModule from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

document.addEventListener("DOMContentLoaded", () => {
  const supabaseUrl = "https://nglasnytfnyavhsxjuau.supabase.co"; // Replace with your Supabase URL
  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nbGFzbnl0Zm55YXZoc3hqdWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MTg4OTQsImV4cCI6MjA2MjM5NDg5NH0.tIDB4uS0jYojQmWRG2EnrxXss3PhcWbFCnVF4_j4dzw"; // Replace with your Supabase Anon Key
  const { createClient } = supabaseModule;
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

  async function loadWorkoutData(userId) {
    if (userId) {
      const { data, error } = await supabaseClient
        .from("workouts") // Replace 'workouts' with your table name
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error loading workout data:", error);
      } else if (data) {
        workoutData = data;
        updateDisplay();
      } else {
        workoutData = {
          pushups: 0,
          squats: 0,
          situps: 0,
          allTimePushups: 0,
          allTimeSquats: 0,
          allTimeSitups: 0,
        };
        updateDisplay();
        saveWorkoutData(userId, workoutData);
      }
    } else {
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

  async function saveWorkoutData(userId, data) {
    if (userId) {
      const { error } = await supabaseClient
        .from("workouts") // Replace 'workouts' with your table name
        .upsert({ user_id: userId, ...data }, { onConflict: ["user_id"] });

      if (error) {
        console.error("Error saving workout data:", error);
      }
    } else {
      console.error("Cannot save data: No user logged in.");
    }
  }

  function updateAuthUI(user) {
    currentUser = user;
    if (user) {
      authContainer.style.display = "none";
      mainElement.style.display = "block";
      logoutButton.style.display = "block";
      userInfoDiv.style.display = "block";
      userInfoDiv.textContent = `Logged in as: ${user.email}`;
      loadWorkoutData(user.id);
    } else {
      authContainer.style.display = "block";
      mainElement.style.display = "none";
      logoutButton.style.display = "none";
      userInfoDiv.style.display = "none";
      loadWorkoutData(null);
    }
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
    button.addEventListener("click", function () {
      const increment = parseInt(this.dataset.increment);
      const workout = this.dataset.workout;
      workoutData[workout] += increment;
      workoutData[
        `allTime${workout.charAt(0).toUpperCase() + workout.slice(1)}`
      ] += increment;
      updateDisplay();
      if (currentUser) {
        saveWorkoutData(currentUser.id, workoutData);
      } else {
        alert("Please log in to save your progress.");
      }
    });
  });

  supabaseClient.auth.getSession().then(({ data: { session } }) => {
    updateAuthUI(session?.user);
  });

  updateDisplay(); // Initial display
});
