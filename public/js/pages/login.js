function showLoginPage() {
  document.getElementById("app").innerHTML =
    '<main class="login-screen"><section class="login-card"><div class="brand"><span class="brand-mark">F</span>FitHub</div><h1>Staff sign in</h1><p>Enter your account details to continue.</p><form id="login-form"><div class="form-field"><label>Username</label><input id="login-user" autocomplete="username" required></div><div class="form-field"><label>Password</label><input id="login-password" type="password" autocomplete="current-password" required></div><div class="field-error" id="login-error"></div><button class="button" style="width:100%;margin-top:8px">Sign in</button></form></section></main>';
  document.getElementById("login-form").onsubmit = async function (event) {
    event.preventDefault();
    const ok = await login(
      document.getElementById("login-user").value.trim(),
      document.getElementById("login-password").value,
    );
    if (!ok) {
      fieldError("login-error", "Incorrect username or password");
      return;
    }
    startApp();
  };
}
