window.onload = function () {
  const student = JSON.parse(localStorage.getItem("studentInfo"));

  if (!student) {
    alert("Login required.");
    window.location.href = "login.html";
    return;
  }

  // Fill student details
      document.getElementById("studentName").innerText = student.name || "-";
      document.getElementById("studentRoll").innerText = student.roll || "-";
      document.getElementById("studentSubject").innerText = student.subject || "-";
      document.getElementById("studentYear").innerText = student.year || "-";
      document.getElementById("studentFather").innerText = student.father || "-";
      document.getElementById("studentMother").innerText = student.mother || "-";
      document.getElementById("studentDOB").innerText = student.dob || "-";


  // Photo
      const img = document.getElementById("studentPhoto");
          img.src = `../assets/photos/${student.roll}.jpg`;
          img.onerror = () => {
         img.src = "../assets/photos/default.jpg";
        };
};

// Start Exam
function startExam() {
  window.location.href = "exam.html";
}

// logout 
function logout() {
  localStorage.removeItem("studentInfo");
  window.location.href = "login.html";
}


// Download latest result by roll no
function downloadMyResult() {
  fetch("/api/results")
    .then(res => res.json())
    .then(files => {
      const student = JSON.parse(localStorage.getItem("studentInfo"));
      const myFile = files.reverse().find(f => f.includes(student.roll));
      if (myFile) {
        window.open(`/api/download-result/${myFile}`, "_blank");
      } else {
        alert("No result found.");
      }
    });
}
