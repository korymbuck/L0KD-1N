import { supabase } from "./supabaseClient.js";
const addFriendInputEl = document.getElementById("add-friend-input");
const addFriendButtonEl = document.getElementById("add-friend-button");
const friendsListEl = document.getElementById("friends-list");
const friendErrorEl = document.getElementById("friend-error");
const addFriendModal = document.getElementById("add-friend-modal");
const openAddFriendModalButton = document.getElementById(
  "open-add-friend-modal"
);
const closeAddFriendModalButton = document.getElementById(
  "close-add-friend-modal"
);

openAddFriendModalButton.addEventListener("click", () => {
  addFriendModal.style.display = "flex";
});

closeAddFriendModalButton.addEventListener("click", () => {
  addFriendModal.style.display = "none";
});

let pageCurrentUser = null;

async function fetchFriendsData() {
  if (!pageCurrentUser) return;
  friendErrorEl.textContent = "";

  try {
    const { data: friendsData, error } = await supabase
      .from("friends")
      .select(
        `
          user_id, 
          friend_id,
          profiles:profiles!friends_friend_id_fkey1 ( 
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

    friendsListEl.innerHTML = processedFriends
      .map((f) => {
        return `
          <div class="friend-card">
            <h3>${f.username}</h3>
            <div class="workout-stats">
              <div class="workout">
                <h4>Push-ups</h4>
                <p>${f.total_pushups}</p>
              </div>
              <div class="workout">
                <h4>Squats</h4>
                <p>${f.total_squats}</p>
              </div>
              <div class="workout">
                <h4>Sit-ups</h4>
                <p>${f.total_situps}</p>
              </div>
            </div>
            <button class="remove-friend" data-id="${f.friend_id}">
              Remove Friend
            </button>
          </div>
        `;
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
