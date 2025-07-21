// Load student data from session
window.addEventListener("DOMContentLoaded", () => {
    const student = JSON.parse(localStorage.getItem("studentInfo"));

    if (!student) {
        alert("Session expired. Please login again.");
        window.location.href = "/html/login.html";
        return;
    }

    // Fill profile
    document.getElementById("studentName").textContent = student.name || "-";
    document.getElementById("studentRoll").textContent = student.roll || "-";
    document.getElementById("studentFather").textContent = student.father || "-";
    document.getElementById("studentMother").textContent = student.mother || "-";
    document.getElementById("studentDOB").textContent = student.dob || "-";
    document.getElementById("studentSubject").textContent = student.subject || "-";
    document.getElementById("studentYear").textContent = student.year || "-";

    const photoPath = student.photo ? `../assets/photos/${student.photo}` : "../assets/photos/default.jpg";
    document.getElementById("studentPhoto").src = photoPath;
});

// Start Exam
function startExam() {
    window.location.href = "/html/exam.html"; // or your exam route
}

// Download Result (latest only)
function downloadMyResult() {
    const student = JSON.parse(localStorage.getItem("studentInfo"));
    if (!student) return;

    fetch("/api/results")
        .then(res => res.json())
        .then(files => {
            const matched = files
                .filter(f => f.includes(student.roll))
                .sort()
                .reverse();

            if (matched.length === 0) {
                alert("❌ No result found yet.");
                return;
            }

            const latest = matched[0];
            window.open(`/api/download-result/${latest}`, "_blank");
        })
        .catch(err => {
            alert("Error fetching result.");
            console.error(err);
        });
}

// Logout
function logout() {
    localStorage.removeItem("studentInfo");
    window.location.href = "/html/login.html";
}
