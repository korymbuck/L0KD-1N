import { supabase } from "./supabaseClient.js";
import * as DOM from "./domElements.js";
import { getLocalDateString } from "./utils.js";
import { getCurrentUser } from "./auth.js";

let localWorkoutStats = {
  pushups: 0,
  squats: 0,
  situps: 0,
  totalPushups: 0,
  totalSquats: 0,
  totalSitups: 0,
};

export function updateWorkoutDisplayOnUI() {
  if (DOM.pushupsCount)
    DOM.pushupsCount.textContent = localWorkoutStats.pushups;
  if (DOM.squatsCount) DOM.squatsCount.textContent = localWorkoutStats.squats;
  if (DOM.situpsCount) DOM.situpsCount.textContent = localWorkoutStats.situps;
  if (DOM.allTimePushups)
    DOM.allTimePushups.textContent = localWorkoutStats.totalPushups;
  if (DOM.allTimeSquats)
    DOM.allTimeSquats.textContent = localWorkoutStats.totalSquats;
  if (DOM.allTimeSitups)
    DOM.allTimeSitups.textContent = localWorkoutStats.totalSitups;
}

export function resetLocalWorkoutStats() {
  localWorkoutStats = {
    pushups: 0,
    squats: 0,
    situps: 0,
    totalPushups: 0,
    totalSquats: 0,
    totalSitups: 0,
  };
}

export async function loadUserWorkoutStats(userId) {
  try {
    const { data, error } = await supabase
      .from("workout_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    const now = new Date();
    const todayLocalDate = getLocalDateString(now);

    if (data) {
      const lastUpdatedDateObj = data.last_updated
        ? new Date(data.last_updated)
        : null;
      const lastLocalDate = getLocalDateString(lastUpdatedDateObj);
      const isNewDay = lastLocalDate !== todayLocalDate;

      localWorkoutStats = {
        pushups: isNewDay ? 0 : data.daily_pushups || 0,
        squats: isNewDay ? 0 : data.daily_squats || 0,
        situps: isNewDay ? 0 : data.daily_situps || 0,
        totalPushups: data.total_pushups || 0,
        totalSquats: data.total_squats || 0,
        totalSitups: data.total_situps || 0,
      };

      if (isNewDay) {
        await supabase
          .from("workout_stats")
          .update({
            daily_pushups: 0,
            daily_squats: 0,
            daily_situps: 0,
            last_updated: now.toISOString(),
          })
          .eq("user_id", userId);
      }
    } else {
      resetLocalWorkoutStats();
      await supabase.from("workout_stats").insert({
        user_id: userId,
        daily_pushups: 0,
        daily_squats: 0,
        daily_situps: 0,
        total_pushups: 0,
        total_squats: 0,
        total_situps: 0,
        last_updated: now.toISOString(),
      });
    }
  } catch (err) {
    console.error("Error loading workout stats:", err);
    if (DOM.authErrorDiv)
      DOM.authErrorDiv.textContent = "Error loading workout stats";
    resetLocalWorkoutStats();
  }
  updateWorkoutDisplayOnUI();
}

async function saveWorkoutStatsToDB(userId) {
  if (!userId) return;
  try {
    await supabase.from("workout_stats").upsert(
      {
        user_id: userId,
        daily_pushups: localWorkoutStats.pushups,
        daily_squats: localWorkoutStats.squats,
        daily_situps: localWorkoutStats.situps,
        total_pushups: localWorkoutStats.totalPushups,
        total_squats: localWorkoutStats.totalSquats,
        total_situps: localWorkoutStats.totalSitups,
        last_updated: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch (err) {
    console.error("Error saving workout stats:", err);
    if (DOM.authErrorDiv)
      DOM.authErrorDiv.textContent = "Error saving workout stats";
  }
}

export async function handleWorkoutIncrement(workoutType, increment) {
  const user = getCurrentUser();
  if (!user) {
    if (DOM.authErrorDiv)
      UI.displayAuthError("Please log in to track workouts");
    return;
  }

  switch (workoutType) {
    case "pushups":
      localWorkoutStats.pushups += increment;
      localWorkoutStats.totalPushups += increment;
      break;
    case "squats":
      localWorkoutStats.squats += increment;
      localWorkoutStats.totalSquats += increment;
      break;
    case "situps":
      localWorkoutStats.situps += increment;
      localWorkoutStats.totalSitups += increment;
      break;
  }
  updateWorkoutDisplayOnUI();
  await saveWorkoutStatsToDB(user.id);
}
