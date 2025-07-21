document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const resetSection = document.getElementById("resetPasswordSection");

    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!username || !password) {
            return alert("Please enter both username and password.");
        }

        fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    if (data.forceReset) {
                        // Show password reset form
                        sessionStorage.setItem("roll", username);
                        resetSection.style.display = "block";
                        loginForm.style.display = "none";
                    } else {
                        if (data.student) {
                            localStorage.setItem("studentInfo", JSON.stringify(data.student));
                        }
                        window.location.href = data.redirect;
                    }
                } else {
                    alert("❌ Invalid login credentials.");
                }
            })
            .catch(err => {
                console.error(err);
                alert("Server error. Please try again later.");
            });
    });
});

function setNewPassword() {
    const roll = sessionStorage.getItem("roll");
    const newPassword = document.getElementById("newPassword").value.trim();

    if (!newPassword || newPassword.length < 4) {
        return alert("Password must be at least 4 characters.");
    }

    fetch("/api/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roll, newPassword })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("✅ Password updated successfully. Please log in again.");
                location.reload();
            } else {
                alert("❌ Error updating password.");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Server error while updating password.");
        });
}
