import * as DOM from "./domElements.js";

export function showAuthModal() {
  if (DOM.authModal) DOM.authModal.style.display = "flex";
  if (DOM.authBackdrop) DOM.authBackdrop.style.display = "block";
}

export function hideAuthModal() {
  if (DOM.authModal) DOM.authModal.style.display = "none";
  if (DOM.authBackdrop) DOM.authBackdrop.style.display = "none";
}

export function updateAuthFormUI(isSignup) {
  if (isSignup) {
    if (DOM.signupFields) DOM.signupFields.style.display = "block";
    if (DOM.loginEmailInput) DOM.loginEmailInput.style.display = "none";
    if (DOM.loginPasswordInput) DOM.loginPasswordInput.style.display = "none";
    if (DOM.loginButton) DOM.loginButton.style.display = "none";
    if (DOM.authTitle) DOM.authTitle.textContent = "Sign Up";
    if (DOM.authToggle)
      DOM.authToggle.textContent = "Already have an account? Log in here";
    if (DOM.signupUsernameInput) DOM.signupUsernameInput.focus();
  } else {
    if (DOM.signupFields) DOM.signupFields.style.display = "none";
    if (DOM.loginEmailInput) DOM.loginEmailInput.style.display = "block";
    if (DOM.loginPasswordInput) DOM.loginPasswordInput.style.display = "block";
    if (DOM.loginButton) DOM.loginButton.style.display = "block";
    if (DOM.authTitle) DOM.authTitle.textContent = "Login";
    if (DOM.authToggle) DOM.authToggle.textContent = "New user? Sign up here";
  }
}

export function displayAuthError(message) {
  if (DOM.authErrorDiv) DOM.authErrorDiv.textContent = message;
}

export function updateUserBar(user, username) {
  if (DOM.userBar) DOM.userBar.style.display = user ? "flex" : "none";
  if (DOM.userInfoDiv)
    DOM.userInfoDiv.textContent = user
      ? `Logged in as: ${username || user.email}`
      : "";
}

export function styleControls() {
  // Style logout button
  if (DOM.logoutButton) {
    DOM.logoutButton.style.backgroundColor = "#B8001F";
    DOM.logoutButton.style.color = "#FCFAEE";
    DOM.logoutButton.style.border = "none";
    DOM.logoutButton.style.padding = "10px 20px";
    DOM.logoutButton.style.borderRadius = "8px";
    DOM.logoutButton.style.fontWeight = "700";
    DOM.logoutButton.style.fontSize = "1rem";
    DOM.logoutButton.style.cursor = "pointer";
    DOM.logoutButton.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.15)";
    DOM.logoutButton.addEventListener(
      "mouseover",
      () => (DOM.logoutButton.style.backgroundColor = "#9a001a")
    );
    DOM.logoutButton.addEventListener(
      "mouseout",
      () => (DOM.logoutButton.style.backgroundColor = "#B8001F")
    );
  }

  // Style username input
  if (DOM.signupUsernameInput) {
    DOM.signupUsernameInput.style.padding = "0.75rem";
    DOM.signupUsernameInput.style.marginTop = "0.5rem";
    DOM.signupUsernameInput.style.borderRadius = "0.5rem";
    DOM.signupUsernameInput.style.border = "1px solid #B8001F";
    DOM.signupUsernameInput.style.backgroundColor = "#384B70";
    DOM.signupUsernameInput.style.color = "#FCFAEE";
    DOM.signupUsernameInput.style.fontSize = "1rem";
    DOM.signupUsernameInput.style.fontFamily = "Montserrat, sans-serif";
    DOM.signupUsernameInput.style.boxSizing = "border-box";
    DOM.signupUsernameInput.style.width = "100%";
    DOM.signupUsernameInput.style.display = "block";
  }
}
