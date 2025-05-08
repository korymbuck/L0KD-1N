document.addEventListener("DOMContentLoaded", () => {
  // Get references to the HTML elements we need to update
  const pushupsCount = document.getElementById("pushups-count");
  const squatsCount = document.getElementById("squats-count");
  const situpsCount = document.getElementById("situps-count");
  const allTimePushups = document.getElementById("all-time-pushups");
  const allTimeSquats = document.getElementById("all-time-squats");
  const allTimeSitups = document.getElementById("all-time-situps");
  const buttons = document.querySelectorAll(".controls button");

  // Key for localStorage to store our workout data
  const STORAGE_KEY = "lokdInWorkoutData";

  // Function to load workout data from localStorage
  function loadWorkoutData() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    } else {
      return {
        pushups: 0,
        squats: 0,
        situps: 0,
        allTimePushups: 0,
        allTimeSquats: 0,
        allTimeSitups: 0,
        lastResetDay: null, // To track daily reset
      };
    }
  }

  // Our workout data object
  let workoutData = loadWorkoutData();

  // Function to save workout data to localStorage
  function saveWorkoutData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workoutData));
  }

  // Function to update the displayed counts on the page
  function updateDisplay() {
    pushupsCount.textContent = workoutData.pushups;
    squatsCount.textContent = workoutData.squats;
    situpsCount.textContent = workoutData.situps;
    allTimePushups.textContent = workoutData.allTimePushups;
    allTimeSquats.textContent = workoutData.allTimeSquats;
    allTimeSitups.textContent = workoutData.allTimeSitups;
  }

  // Function to check if a new day has started and reset daily counts if so
  function checkDailyReset() {
    const today = new Date().toLocaleDateString();
    if (workoutData.lastResetDay !== today) {
      workoutData.pushups = 0;
      workoutData.squats = 0;
      workoutData.situps = 0;
      workoutData.lastResetDay = today;
      saveWorkoutData();
    }
  }

  // Call checkDailyReset when the page loads
  checkDailyReset();
  updateDisplay(); // Initial display of loaded/reset data

  // Add event listeners to all the increment buttons
  buttons.forEach((button) => {
    button.addEventListener("click", function () {
      console.log("Button clicked!"); // ADDED CONSOLE LOG
      const increment = parseInt(this.dataset.increment);
      const workout = this.dataset.workout;

      workoutData[workout] += increment;
      workoutData[
        "allTime" + workout.charAt(0).toUpperCase() + workout.slice(1)
      ] += increment;

      updateDisplay();
      saveWorkoutData();
    });
  });
});
