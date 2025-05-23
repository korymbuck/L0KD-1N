// script.js — full version with styled username input and Supabase auth logic

const supabaseUrl = "https://nglasnytfnyavhsxjuau.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nbGFzbnl0Zm55YXZoc3hqdWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MTg4OTQsImV4cCI6MjA2MjM5NDg5NH0.tIDB4uS0jYojQmWRG2EnrxXss3PhcWbFCnVF4_j4dzw";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

function getLocalDateString(dateObj) {
  if (!dateObj) return null;
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-indexed
  const day = dateObj.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const loginButton = document.getElementById("login-button");

const signupEmailInput = document.getElementById("signup-email");
const signupPasswordInput = document.getElementById("signup-password");
const signupUsernameInput = document.getElementById("signup-username");
const signupButton = document.getElementById("signup-button");

const authErrorDiv = document.getElementById("auth-error");
const userBar = document.getElementById("user-bar");
const logoutButton = document.getElementById("logout-button");
const userInfoDiv = document.getElementById("user-info");
const authContainer = document.getElementById("auth-modal");

const pushupsCount = document.getElementById("pushups-count");
const squatsCount = document.getElementById("squats-count");
const situpsCount = document.getElementById("situps-count");
const allTimePushups = document.getElementById("all-time-pushups");
const allTimeSquats = document.getElementById("all-time-squats");
const allTimeSitups = document.getElementById("all-time-situps");
const workoutButtons = document.querySelectorAll(".workout button");

// Style logout button
logoutButton.style.backgroundColor = "#B8001F";
logoutButton.style.color = "#FCFAEE";
logoutButton.style.border = "none";
logoutButton.style.padding = "10px 20px";
logoutButton.style.borderRadius = "8px";
logoutButton.style.fontWeight = "700";
logoutButton.style.fontSize = "1rem";
logoutButton.style.cursor = "pointer";
logoutButton.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.15)";
logoutButton.addEventListener("mouseover", () => {
  logoutButton.style.backgroundColor = "#9a001a";
});
logoutButton.addEventListener("mouseout", () => {
  logoutButton.style.backgroundColor = "#B8001F";
});

// Style username input
if (signupUsernameInput) {
  signupUsernameInput.style.padding = "0.75rem";
  signupUsernameInput.style.marginTop = "0.5rem";
  signupUsernameInput.style.borderRadius = "0.5rem";
  signupUsernameInput.style.border = "1px solid #B8001F";
  signupUsernameInput.style.backgroundColor = "#384B70";
  signupUsernameInput.style.color = "#FCFAEE";
  signupUsernameInput.style.fontSize = "1rem";
  signupUsernameInput.style.fontFamily = "Montserrat, sans-serif";
  signupUsernameInput.style.boxSizing = "border-box";
  signupUsernameInput.style.width = "100%";
  signupUsernameInput.style.display = "block";
}

let currentUser = null;
let workoutStats = {
  pushups: 0,
  squats: 0,
  situps: 0,
  totalPushups: 0,
  totalSquats: 0,
  totalSitups: 0,
};

function showAuthModal() {
  document.getElementById("auth-modal").style.display = "flex";
  document.getElementById("auth-backdrop").style.display = "block";
}

function hideAuthModal() {
  document.getElementById("auth-modal").style.display = "none";
  document.getElementById("auth-backdrop").style.display = "none";
}

function updateWorkoutDisplay() {
  pushupsCount.textContent = workoutStats.pushups;
  squatsCount.textContent = workoutStats.squats;
  situpsCount.textContent = workoutStats.situps;
  allTimePushups.textContent = workoutStats.totalPushups;
  allTimeSquats.textContent = workoutStats.totalSquats;
  allTimeSitups.textContent = workoutStats.totalSitups;
}

function resetWorkoutStats() {
  workoutStats = {
    pushups: 0,
    squats: 0,
    situps: 0,
    totalPushups: 0,
    totalSquats: 0,
    totalSitups: 0,
  };
  updateWorkoutDisplay();
}

async function updateUIState(user) {
  if (user) {
    hideAuthModal();
    userBar.style.display = "flex"; // This will now correctly target the user-bar

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      // Ensure userInfoDiv is correctly populated
      userInfoDiv.textContent = `Logged in as: ${
        profile?.username || user.email
      }`;
      loadWorkoutStats(user.id);
    } catch (err) {
      console.error("Failed to load user profile:", err);
      // Fallback if profile fetch fails but user exists
      userInfoDiv.textContent = `Logged in as: ${user.email}`;
    }
  } else {
    userBar.style.display = "none";
    userInfoDiv.textContent = "";
    resetWorkoutStats();
    // showAuthModal(); // Consider if you always want to show modal on logout/initial load without session
  }
}

async function loadWorkoutStats(userId) {
  try {
    const { data, error } = await supabase
      .from("workout_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    // PGRST116: no rows found, not an error for .single() if we handle it (data will be null)
    if (error && error.code !== "PGRST116") throw error;

    const now = new Date(); // Current date/time in local timezone
    const todayLocalDate = getLocalDateString(now);

    if (data) {
      // Assuming data.last_updated is an ISO string from Supabase (stored as TIMESTAMPTZ)
      const lastUpdatedDateObj = data.last_updated
        ? new Date(data.last_updated)
        : null;
      const lastLocalDate = getLocalDateString(lastUpdatedDateObj);

      const isNewDay = lastLocalDate !== todayLocalDate;

      workoutStats = {
        pushups: isNewDay ? 0 : data.daily_pushups || 0,
        squats: isNewDay ? 0 : data.daily_squats || 0,
        situps: isNewDay ? 0 : data.daily_situps || 0,
        totalPushups: data.total_pushups || 0,
        totalSquats: data.total_squats || 0,
        totalSitups: data.total_situps || 0,
      };

      if (isNewDay) {
        const { error: updateError } = await supabase
          .from("workout_stats")
          .update({
            daily_pushups: 0,
            daily_squats: 0,
            daily_situps: 0,
            last_updated: now.toISOString(), // Store current timestamp (UTC)
          })
          .eq("user_id", userId);
        if (updateError) {
          console.error("Error updating daily stats for new day:", updateError);
          if (authErrorDiv)
            authErrorDiv.textContent = "Error resetting daily stats.";
        }
      }
    } else {
      // No data found, implies new user for workout_stats table
      // Reset local workoutStats for this new user context
      workoutStats = {
        pushups: 0,
        squats: 0,
        situps: 0,
        totalPushups: 0,
        totalSquats: 0,
        totalSitups: 0,
      };
      // Insert new record for the user
      const { error: insertError } = await supabase
        .from("workout_stats")
        .insert({
          user_id: userId,
          daily_pushups: 0,
          daily_squats: 0,
          daily_situps: 0,
          total_pushups: 0,
          total_squats: 0,
          total_situps: 0,
          last_updated: now.toISOString(), // Store current timestamp (UTC)
        });
      if (insertError) {
        console.error("Error inserting new workout stats record:", insertError);
        if (authErrorDiv)
          authErrorDiv.textContent = "Error initializing workout stats.";
      }
    }

    updateWorkoutDisplay();
  } catch (err) {
    console.error("Error loading workout stats:", err);
    if (authErrorDiv) authErrorDiv.textContent = "Error loading workout stats";
  }
}

async function saveWorkoutStats(userId) {
  if (!userId) return;
  try {
    const { error } = await supabase.from("workout_stats").upsert(
      {
        user_id: userId,
        daily_pushups: workoutStats.pushups,
        daily_squats: workoutStats.squats,
        daily_situps: workoutStats.situps,
        total_pushups: workoutStats.totalPushups,
        total_squats: workoutStats.totalSquats,
        total_situps: workoutStats.totalSitups,
        last_updated: new Date().toISOString(), // Update last_updated on every save
      },
      { onConflict: "user_id" }
    );
    if (error) throw error;
  } catch (err) {
    console.error("Error saving workout stats:", err);
    if (authErrorDiv) authErrorDiv.textContent = "Error saving workout stats";
  }
}

workoutButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (!currentUser) {
      authErrorDiv.textContent = "Please log in to track workouts";
      return;
    }
    const increment = parseInt(button.dataset.increment);
    const workout = button.dataset.workout;
    switch (workout) {
      case "pushups":
        workoutStats.pushups += increment;
        workoutStats.totalPushups += increment;
        break;
      case "squats":
        workoutStats.squats += increment;
        workoutStats.totalSquats += increment;
        break;
      case "situps":
        workoutStats.situps += increment;
        workoutStats.totalSitups += increment;
        break;
    }
    updateWorkoutDisplay();
    await saveWorkoutStats(currentUser.id);
  });
});

loginButton.addEventListener("click", async () => {
  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value.trim();
  authErrorDiv.textContent = "";
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    currentUser = data.user;
    updateUIState(currentUser);
  } catch (err) {
    authErrorDiv.textContent = err.message || "Login failed";
  }
});

signupButton.addEventListener("click", async () => {
  const email = signupEmailInput.value.trim();
  const password = signupPasswordInput.value.trim();
  const username = signupUsernameInput.value.trim();
  authErrorDiv.textContent = "";
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (username) {
      const { data: existing, error: existingError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();
      if (existingError && existingError.code !== "PGRST116")
        throw existingError;
      if (existing) {
        authErrorDiv.textContent = "That username is already taken.";
        signupUsernameInput.focus();
        return;
      }
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        username,
      });
      if (profileError) throw profileError;
    }
    authErrorDiv.textContent = "Signup successful! Please check your email.";
  } catch (err) {
    authErrorDiv.textContent = err.message || "Signup failed";
  }
});

logoutButton.addEventListener("click", async () => {
  const confirmed = confirm("Are you sure you want to log out?");
  if (!confirmed) return;
  try {
    await supabase.auth.signOut();
    currentUser = null;
    updateUIState(null);
  } catch (err) {
    console.error("Logout error:", err);
  }
});

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN") {
    currentUser = session.user;
    updateUIState(currentUser);
  } else if (event === "SIGNED_OUT") {
    currentUser = null;
    updateUIState(null);
  }
});

supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) {
    currentUser = session.user;
    updateUIState(currentUser);
  } else {
    showAuthModal(); // 👈 add this
    updateUIState(null);
  }
});

const authToggle = document.getElementById("auth-toggle");
const authTitle = document.getElementById("auth-title");
const signupFields = document.getElementById("signup-fields");

let showingSignup = false;

authToggle.addEventListener("click", () => {
  showingSignup = !showingSignup;
  if (showingSignup) {
    signupFields.style.display = "block";
    loginEmailInput.style.display = "none";
    loginPasswordInput.style.display = "none";
    loginButton.style.display = "none";
    authTitle.textContent = "Sign Up";
    authToggle.textContent = "Already have an account? Log in here";
    signupUsernameInput.focus();
  } else {
    signupFields.style.display = "none";
    loginEmailInput.style.display = "block";
    loginPasswordInput.style.display = "block";
    loginButton.style.display = "block";
    authTitle.textContent = "Login";
    authToggle.textContent = "New user? Sign up here";
  }
});
