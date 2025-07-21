document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (data.forceReset) {
          document.getElementById("resetPasswordSection").style.display = "block";
        } else {
          if (data.student) {
            localStorage.setItem("studentInfo", JSON.stringify(data.student));
          }
          window.location.href = data.redirect;
        }
      } else {
        alert("Login failed. Try again.");
      }
    });
});

function setNewPassword() {
  const roll = document.getElementById("username").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();

  if (!newPassword) return alert("Please enter a new password.");

  fetch("/api/update-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roll, newPassword })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Password updated. Please login again.");
        location.reload();
      } else {
        alert("Error updating password.");
      }
    });
}
