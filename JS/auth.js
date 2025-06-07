import { supabase } from "./supabaseClient.js";
import * as UI from "./ui.js";
import {
  loadUserWorkoutStats,
  resetLocalWorkoutStats,
  updateWorkoutDisplayOnUI,
} from "./workouts.js";

let localCurrentUser = null;

export function getCurrentUser() {
  return localCurrentUser;
}

async function fetchUserProfile(userId) {
  console.log("Auth: fetchUserProfile called for userId:", userId);
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();
    console.log("Auth: fetchUserProfile Supabase response:", {
      profile,
      error,
    });
    if (error && error.code !== "PGRST116") throw error;
    return profile;
  } catch (err) {
    console.error("Auth: Failed to load user profile:", err);
    return null;
  }
}

async function handleAuthenticatedUser(user) {
  console.log("Auth: handleAuthenticatedUser called with user:", user);
  localCurrentUser = user;
  UI.hideAuthModal();
  const profile = await fetchUserProfile(user.id);
  UI.updateUserBar(user, profile?.username);
  await loadUserWorkoutStats(user.id);
  console.log("Auth: handleAuthenticatedUser completed.");
}

function handleSignedOutUser() {
  console.log("Auth: handleSignedOutUser called.");
  localCurrentUser = null;
  UI.updateUserBar(null);
  resetLocalWorkoutStats();
  updateWorkoutDisplayOnUI(); // Show 0s
  UI.showAuthModal();
  console.log("Auth: handleSignedOutUser completed.");
}

export async function signInUser(email, password) {
  console.log("Auth: signInUser function started", { email });
  UI.displayAuthError("");
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log("Auth: Supabase signInWithPassword response:", { data, error });
    if (error) throw error;
    // Auth state change will trigger handleAuthenticatedUser
    console.log("Auth: signInUser successful, returning user:", data.user);
    return { success: true, user: data.user };
  } catch (err) {
    console.error("Auth: Error in signInUser:", err);
    UI.displayAuthError(err.message || "Login failed");
    return { success: false, error: err };
  }
}

export async function signUpUser(email, password, username) {
  console.log("Auth: signUpUser function started", { email, username });
  UI.displayAuthError("");
  try {
    if (username) {
      console.log("Auth: Checking if username exists:", username);
      const { data: existingProfile, error: existingError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();
      console.log("Auth: Username check Supabase response:", {
        existingProfile,
        existingError,
      });
      if (existingError && existingError.code !== "PGRST116")
        throw existingError;
      if (existingProfile) {
        console.log("Auth: Username already taken:", username);
        UI.displayAuthError("That username is already taken.");
        return { success: false, error: { message: "Username taken" } };
      }
      console.log("Auth: Username is available:", username);
    }

    console.log("Auth: Attempting Supabase signUp with email:", email);
    const { data, error } = await supabase.auth.signUp({ email, password });
    console.log("Auth: Supabase signUp response:", { data, error });
    if (error) throw error;

    if (username && data.user) {
      console.log(
        "Auth: Attempting to insert profile for user:",
        data.user.id,
        "with username:",
        username
      );
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        username,
      });
      console.log("Auth: Profile insert Supabase response:", { profileError });
      if (profileError) throw profileError;
      console.log(
        "Auth: Profile inserted successfully for username:",
        username
      );
    }
    UI.displayAuthError("Signup successful! Please check your email.");
    console.log("Auth: signUpUser successful, returning user:", data.user);
    return { success: true, user: data.user };
  } catch (err) {
    console.error("Auth: Error in signUpUser:", err);
    UI.displayAuthError(err.message || "Signup failed");
    return { success: false, error: err };
  }
}

export async function signOutUser() {
  console.log("Auth: signOutUser function started.");
  const confirmed = confirm("Are you sure you want to log out?");
  if (!confirmed) {
    console.log("Auth: Logout cancelled by user.");
    return { success: false, reason: "cancelled" };
  }
  try {
    console.log("Auth: Attempting Supabase signOut.");
    await supabase.auth.signOut();
    console.log("Auth: Supabase signOut successful.");
    // Auth state change will trigger handleSignedOutUser
    return { success: true };
  } catch (err) {
    console.error("Auth: Logout error:", err);
    return { success: false, error: err };
  }
}

export function initializeAuth() {
  console.log("Auth: initializeAuth called.");
  supabase.auth.onAuthStateChange((event, session) => {
    console.log("Auth: onAuthStateChange event:", event, "session:", session);
    if (event === "SIGNED_IN" && session?.user) {
      console.log("Auth: onAuthStateChange - SIGNED_IN");
      handleAuthenticatedUser(session.user);
    } else if (event === "SIGNED_OUT") {
      console.log("Auth: onAuthStateChange - SIGNED_OUT");
      handleSignedOutUser();
    } else {
      console.log(
        "Auth: onAuthStateChange - Other event or no user in session:",
        event
      );
    }
  });

  console.log("Auth: Calling getSession.");
  supabase.auth
    .getSession()
    .then(({ data: { session } }) => {
      console.log("Auth: getSession response - session:", session);
      if (session?.user) {
        console.log("Auth: getSession - User found in session.");
        handleAuthenticatedUser(session.user);
      } else {
        console.log("Auth: getSession - No user in session.");
        handleSignedOutUser();
      }
    })
    .catch((error) => {
      console.error("Auth: Error in getSession:", error);
    });
  console.log("Auth: initializeAuth completed.");
}
