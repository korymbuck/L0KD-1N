import { supabase } from "./supabaseClient.js";
const addFriendInputEl = document.getElementById("add-friend-input");
const addFriendButtonEl = document.getElementById("add-friend-button");
const friendsListEl = document.getElementById("friends-list");
const friendErrorEl = document.getElementById("friend-error");

let pageCurrentUser = null;

async function fetchFriendsData() {
  if (!pageCurrentUser) return;
  friendErrorEl.textContent = "";

  try {
    const { data: friendsData, error } = await supabase
      .from("friends")
      .select(
        `
                friend_id,
                profiles:friend_id (
                    username,
                    workout_stats ( total_pushups, total_squats, total_situps )
                )
            `
      )
      .eq("user_id", pageCurrentUser.id);

    if (error) throw error;

    const processedFriends = friendsData.map((f) => {
      const profile = f.profiles;
      const stats =
        profile?.workout_stats && profile.workout_stats.length > 0
          ? profile.workout_stats[0]
          : { total_pushups: 0, total_squats: 0, total_situps: 0 };
      return {
        friend_id: f.friend_id,
        username: profile?.username || "Unknown",
        total_pushups: stats.total_pushups || 0,
        total_squats: stats.total_squats || 0,
        total_situps: stats.total_situps || 0,
      };
    });

    const sortedFriends = processedFriends.sort((a, b) => {
      const aTotal = a.total_pushups + a.total_squats + a.total_situps;
      const bTotal = b.total_pushups + b.total_squats + b.total_situps;
      return bTotal - aTotal;
    });

    friendsListEl.innerHTML = sortedFriends
      .map((f, i) => {
        const totalWorkouts = f.total_pushups + f.total_squats + f.total_situps;
        const isSelf = f.friend_id === pageCurrentUser.id;
        return `
                <div class="friend-card">
                    <strong>#${i + 1} ${
          isSelf ? '<span style="color:#FFD700">You</span>' : f.username
        }</strong><br />
                    Pushups: ${f.total_pushups}, Squats: ${
          f.total_squats
        }, Situps: ${f.total_situps}<br />
                    <em>Total Workouts: ${totalWorkouts}</em><br />
                    ${
                      !isSelf
                        ? `<button class='remove-friend' data-id='${f.friend_id}'>Remove</button>`
                        : ""
                    }
                </div>`;
      })
      .join("");

    document.querySelectorAll(".remove-friend").forEach((btn) => {
      btn.addEventListener("click", async (event) => {
        const friendIdToRemove = event.target.dataset.id;
        await removeFriendData(friendIdToRemove);
      });
    });
  } catch (error) {
    console.error("Error fetching friends:", error);
    friendErrorEl.textContent = "Failed to load friends list.";
  }
}

async function addFriendData() {
  if (!pageCurrentUser) return;
  const usernameToAdd = addFriendInputEl.value.trim();
  friendErrorEl.textContent = "";

  if (!usernameToAdd) {
    friendErrorEl.textContent = "Please enter a username.";
    return;
  }

  try {
    const { data: profile, error: lookupError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", usernameToAdd)
      .single();

    if (lookupError || !profile) {
      friendErrorEl.textContent = "User not found.";
      console.error("User lookup error:", lookupError);
      return;
    }

    if (profile.id === pageCurrentUser.id) {
      friendErrorEl.textContent =
        "You are trying to add yourself. This will show you on your leaderboard.";
    }

    const { data: existing, error: existingError } = await supabase
      .from("friends")
      .select("id")
      .eq("user_id", pageCurrentUser.id)
      .eq("friend_id", profile.id)
      .maybeSingle();

    if (existingError && existingError.code !== "PGRST116") throw existingError;
    if (existing) {
      friendErrorEl.textContent = "You have already added this friend.";
      return;
    }

    const { error: insertError } = await supabase.from("friends").insert({
      user_id: pageCurrentUser.id,
      friend_id: profile.id,
    });

    if (insertError) throw insertError;

    addFriendInputEl.value = "";
    await fetchFriendsData();
  } catch (error) {
    console.error("Error in addFriendData:", error);
    friendErrorEl.textContent =
      error.message ||
      "Could not add friend. They may need to set up their profile first.";
  }
}

async function removeFriendData(friendIdToRemove) {
  if (!pageCurrentUser || !friendIdToRemove) return;
  const confirmed = confirm("Are you sure you want to remove this friend?");
  if (!confirmed) return;

  try {
    const { error } = await supabase
      .from("friends")
      .delete()
      .eq("user_id", pageCurrentUser.id)
      .eq("friend_id", friendIdToRemove);

    if (error) throw error;
    await fetchFriendsData();
  } catch (error) {
    console.error("Error removing friend:", error);
    friendErrorEl.textContent = "Could not remove friend.";
  }
}

function initializeFriendsPage() {
  if (addFriendButtonEl) {
    addFriendButtonEl.addEventListener("click", addFriendData);
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      pageCurrentUser = session.user;
      fetchFriendsData();
    } else if (event === "SIGNED_OUT") {
      pageCurrentUser = null;
      if (friendsListEl)
        friendsListEl.innerHTML =
          "<p>Please log in to see the leaderboard.</p>";
    }
  });

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      pageCurrentUser = session.user;
      fetchFriendsData();
    } else {
      window.location.href = "index.html";
    }
  });
}

initializeFriendsPage();
