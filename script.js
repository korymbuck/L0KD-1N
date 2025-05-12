// script.js
// Updated with daily reset logic

const supabaseUrl = "https://nglasnytfnyavhsxjuau.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nbGFzbnl0Zm55YXZoc3hqdWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MTg4OTQsImV4cCI6MjA2MjM5NDg5NH0.tIDB4uS0jYojQmWRG2EnrxXss3PhcWbFCnVF4_j4dzw";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let workoutStats = {
  pushups: 0,
  squats: 0,
  situps: 0,
  totalPushups: 0,
  totalSquats: 0,
  totalSitups: 0,
};

function updateUIState(user) {
  if (user) {
    authContainer.style.display = "none";
    logoutButton.style.display = "block";
    userInfoDiv.style.display = "block";
    userInfoDiv.textContent = `Logged in as: ${user.email}`;
    checkAndResetDailyStats(user.id);
  } else {
    authContainer.style.display = "block";
    logoutButton.style.display = "none";
    userInfoDiv.style.display = "none";
    userInfoDiv.textContent = "";
    resetWorkoutStats();
  }
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

function updateWorkoutDisplay() {
  pushupsCount.textContent = workoutStats.pushups;
  squatsCount.textContent = workoutStats.squats;
  situpsCount.textContent = workoutStats.situps;
  allTimePushups.textContent = workoutStats.totalPushups;
  allTimeSquats.textContent = workoutStats.totalSquats;
  allTimeSitups.textContent = workoutStats.totalSitups;
}

async function checkAndResetDailyStats(userId) {
  const today = new Date().toISOString().split("T")[0];
  try {
    const { data, error } = await supabase
      .from("workout_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    if (data) {
      const lastReset = data.last_reset_date;
      if (lastReset !== today) {
        await supabase
          .from("workout_stats")
          .update({
            daily_pushups: 0,
            daily_squats: 0,
            daily_situps: 0,
            last_reset_date: today,
          })
          .eq("user_id", userId);
        data.daily_pushups = 0;
        data.daily_squats = 0;
        data.daily_situps = 0;
      }
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
        last_reset_date: today,
      });
    }
    updateWorkoutDisplay();
  } catch (err) {
    console.error("Error loading/resetting stats:", err);
    authErrorDiv.textContent = "Error loading/resetting workout stats";
  }
}
