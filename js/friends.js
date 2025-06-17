document.addEventListener("DOMContentLoaded", () => {
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

  if (openAddFriendModalButton) {
    openAddFriendModalButton.addEventListener("click", () => {
      addFriendModal.style.display = "flex";
    });
  }

  if (closeAddFriendModalButton) {
    closeAddFriendModalButton.addEventListener("click", () => {
      addFriendModal.style.display = "none";
    });
  }

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

  // Initialize the page
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
