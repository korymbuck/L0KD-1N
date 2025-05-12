// No import needed — using global 'supabase' from CDN
document.addEventListener("DOMContentLoaded", () => {
  const supabaseUrl = "https://nglasnytfnyavhsxjuau.supabase.co";
  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nbGFzbnl0Zm55YXZoc3hqdWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MTg4OTQsImV4cCI6MjA2MjM5NDg5NH0.tIDB4uS0jYojQmWRG2EnrxXss3PhcWbFCnVF4_j4dzw"; // Replace with env-safe version later
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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

  const pushupsCount = document.getElementById("pushups-count");
  const squatsCount = document.getElementById("squats-count");
  const situpsCount = document.getElementById("situps-count");
  const allTimePushups = document.getElementById("all-time-pushups");
  const allTimeSquats = document.getElementById("all-time-squats");
  const allTimeSitups = document.getElementById("all-time-situps");
  const workoutButtons = document.querySelectorAll(".workout button");

  let currentUser = null;
  let workoutStats = {
    pushups: 0,
    squats: 0,
    situps: 0,
    totalPushups: 0,
    totalSquats: 0,
    totalSitups: 0,
  };

  const updateUIState = (user) => {
    if (user) {
      authContainer.style.display = "none";
      logoutButton.style.display = "block";
      userInfoDiv.style.display = "block";
      userInfoDiv.textContent = `Logged in as: ${user.email}`;
      loadWorkoutStats(user.id);
    } else {
      authContainer.style.display = "block";
      logoutButton.style.display = "none";
      userInfoDiv.style.display = "none";
      userInfoDiv.textContent = "";
      resetWorkoutStats();
    }
  };

  const resetWorkoutStats = () => {
    workoutStats = {
      pushups: 0,
      squats: 0,
      situps: 0,
      totalPushups: 0,
      totalSquats: 0,
      totalSitups: 0,
    };
    updateWorkoutDisplay();
  };

  const updateWorkoutDisplay = () => {
    pushupsCount.textContent = workoutStats.pushups;
    squatsCount.textContent = workoutStats.squats;
    situpsCount.textContent = workoutStats.situps;
    allTimePushups.textContent = workoutStats.totalPushups;
    allTimeSquats.textContent = workoutStats.totalSquats;
    allTimeSitups.textContent = workoutStats.totalSitups;
  };

  const loadWorkoutStats = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("workout_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        workoutStats = {
          pushups: data.daily_pushups || 0,
          squats: data.daily_squats || 0,
          situps: data.daily_situps || 0,
          totalPushups: data.total_pushups || 0,
          totalSquats: data.total_squats || 0,
          totalSitups: data.total_situps || 0,
        };
      } else {
        await supabase.from("workout_stats").insert({
          user_id: userId,
          daily_pushups: 0,
          daily_squats: 0,
          daily_situps: 0,
          total_pushups: 0,
          total_squats: 0,
          total_situps: 0,
        });
      }

      updateWorkoutDisplay();
    } catch (err) {
      console.error("Error loading workout stats:", err);
      authErrorDiv.textContent = "Error loading workout stats";
    }
  };

  const saveWorkoutStats = async (userId) => {
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
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
    } catch (err) {
      console.error("Error saving workout stats:", err);
      authErrorDiv.textContent = "Error saving workout stats";
    }
  };

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
        return;
      }

      signupEmailInput.value = "";
      signupPasswordInput.value = "";

      if (!data.user?.confirmed_at) {
        authErrorDiv.textContent =
          "Signup successful! Please confirm your email.";
      }
    } catch (err) {
      authErrorDiv.textContent = "Unexpected signup error.";
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
        return;
      }

      loginEmailInput.value = "";
      loginPasswordInput.value = "";
    } catch (err) {
      authErrorDiv.textContent = "Unexpected login error.";
      console.error(err);
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Logout error:", error);
    } catch (err) {
      console.error("Unexpected logout error:", err);
    }
  });

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

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN") {
      currentUser = session.user;
      updateUIState(currentUser);
    } else if (event === "SIGNED_OUT") {
      currentUser = null;
      updateUIState(null);
    }
  });

  // Restore session on page load
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      currentUser = session.user;
      updateUIState(currentUser);
    } else {
      updateUIState(null);
    }
  });
});
