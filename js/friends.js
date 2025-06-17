document.addEventListener("DOMContentLoaded", () => {
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
            user_id, 
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

      friendsListEl.innerHTML = processedFriends
        .map((f) => {
          return `
            <div>
              <h3>${f.username}</h3>
              <p>Push-ups: ${f.total_pushups}</p>
              <p>Squats: ${f.total_squats}</p>
              <p>Sit-ups: ${f.total_situps}</p>
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
    const friendUsername = addFriendInputEl.value.trim();
    if (!friendUsername) {
      friendErrorEl.textContent = "Please enter a username.";
      return;
    }

    friendErrorEl.textContent = ""; // Clear any previous errors

    try {
      // Fetch the friend's profile by username
      const { data: friendProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", friendUsername)
        .single();

      if (fetchError) {
        console.error("Error fetching friend's profile:", fetchError);
        friendErrorEl.textContent = "User not found.";
        return;
      }

      const friendId = friendProfile.id;

      // Add the friend to the "friends" table
      const { error: insertError } = await supabase.from("friends").insert({
        user_id: pageCurrentUser.id,
        friend_id: friendId,
      });

      if (insertError) {
        console.error("Error adding friend:", insertError);
        friendErrorEl.textContent = "Failed to add friend.";
        return;
      }

      // Clear the input field
      addFriendInputEl.value = "";

      // Refresh the friends list
      fetchFriendsData();
    } catch (error) {
      console.error("Error in addFriendData:", error);
      friendErrorEl.textContent = "An unexpected error occurred.";
    }
  }

  async function removeFriendData(friendId) {
    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("user_id", pageCurrentUser.id)
        .eq("friend_id", friendId);

      if (error) {
        console.error("Error removing friend:", error);
        friendErrorEl.textContent = "Failed to remove friend.";
        return;
      }

      // Refresh the friends list
      fetchFriendsData();
    } catch (error) {
      console.error("Error in removeFriendData:", error);
      friendErrorEl.textContent = "An unexpected error occurred.";
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
});
