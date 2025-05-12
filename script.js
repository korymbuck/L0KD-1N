// script.js
// Updated: auth panel as modal with backdrop, inputs, and submit logic

const supabaseUrl = "https://nglasnytfnyavhsxjuau.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nbGFzbnl0Zm55YXZoc3hqdWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MTg4OTQsImV4cCI6MjA2MjM5NDg5NH0.tIDB4uS0jYojQmWRG2EnrxXss3PhcWbFCnVF4_j4dzw";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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

function updateUIState(user) {
  if (user) {
    hideAuthModal();
    logoutButton.style.display = "block";
    userInfoDiv.style.display = "block";
    userInfoDiv.textContent = `Logged in as: ${user.email}`;
  } else {
    showAuthModal();
    logoutButton.style.display = "none";
    userInfoDiv.style.display = "none";
    userInfoDiv.textContent = "";
  }
}

signupButton.addEventListener("click", async () => {
  const email = signupEmailInput.value.trim();
  const password = signupPasswordInput.value.trim();
  authErrorDiv.textContent = "";

  if (!email || !password) {
    authErrorDiv.textContent = "Email and password are required.";
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      authErrorDiv.textContent = error.message;
    } else {
      authErrorDiv.textContent =
        "Signup successful! Please confirm your email.";
    }
  } catch (err) {
    authErrorDiv.textContent = "Unexpected error during signup.";
    console.error(err);
  }
});

loginButton.addEventListener("click", async () => {
  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value.trim();
  authErrorDiv.textContent = "";

  if (!email || !password) {
    authErrorDiv.textContent = "Email and password are required.";
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      authErrorDiv.textContent = error.message;
    } else {
      currentUser = data.user;
      updateUIState(currentUser);
    }
  } catch (err) {
    authErrorDiv.textContent = "Unexpected error during login.";
    console.error(err);
  }
});

logoutButton.addEventListener("click", async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Logout error:", error);
    currentUser = null;
    updateUIState(null);
  } catch (err) {
    console.error("Unexpected logout error:", err);
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
    updateUIState(null);
  }
});
