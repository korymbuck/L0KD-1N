import { supabase } from "./supabaseClient.js";
import * as UI from "./ui.js";
import {
  loadUserWorkoutStats,
  resetLocalWorkoutStats,
  updateWorkoutDisplayOnUI,
} from "./workouts.js"; // Renamed updateWorkoutDisplay

let localCurrentUser = null;

export function getCurrentUser() {
  return localCurrentUser;
}

async function fetchUserProfile(userId) {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();
    if (error && error.code !== "PGRST116") throw error; // PGRST116 means no rows found, which is fine for .single()
    return profile;
  } catch (err) {
    console.error("Failed to load user profile:", err);
    return null;
  }
}

async function handleAuthenticatedUser(user) {
  localCurrentUser = user;
  UI.hideAuthModal();
  const profile = await fetchUserProfile(user.id);
  UI.updateUserBar(user, profile?.username);
  await loadUserWorkoutStats(user.id);
}

function handleSignedOutUser() {
  localCurrentUser = null;
  UI.updateUserBar(null);
  resetLocalWorkoutStats();
  updateWorkoutDisplayOnUI(); // Show 0s
  UI.showAuthModal();
}

export async function signInUser(email, password) {
  UI.displayAuthError("");
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    // Auth state change will trigger handleAuthenticatedUser
    return { success: true, user: data.user };
  } catch (err) {
    UI.displayAuthError(err.message || "Login failed");
    return { success: false, error: err };
  }
}

export async function signUpUser(email, password, username) {
  UI.displayAuthError("");
  try {
    if (username) {
      const { data: existingProfile, error: existingError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();
      if (existingError && existingError.code !== "PGRST116")
        throw existingError;
      if (existingProfile) {
        UI.displayAuthError("That username is already taken.");
        return { success: false, error: { message: "Username taken" } };
      }
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (username && data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        username,
      });
      if (profileError) throw profileError;
    }
    UI.displayAuthError("Signup successful! Please check your email.");
    return { success: true, user: data.user };
  } catch (err) {
    UI.displayAuthError(err.message || "Signup failed");
    return { success: false, error: err };
  }
}

export async function signOutUser() {
  const confirmed = confirm("Are you sure you want to log out?");
  if (!confirmed) return { success: false, reason: "cancelled" };
  try {
    await supabase.auth.signOut();
    // Auth state change will trigger handleSignedOutUser
    return { success: true };
  } catch (err) {
    console.error("Logout error:", err);
    return { success: false, error: err };
  }
}

export function initializeAuth() {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      handleAuthenticatedUser(session.user);
    } else if (event === "SIGNED_OUT") {
      handleSignedOutUser();
    }
  });

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      handleAuthenticatedUser(session.user);
    } else {
      handleSignedOutUser();
    }
  });
}
