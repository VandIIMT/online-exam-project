let questions = [];
let current = 0;
let answers = {};
let timer;
let totalTime = 30 * 60; // 30 minutes
let tabSwitchCount = 0;

const student = JSON.parse(localStorage.getItem("studentInfo"));

window.onload = function () {
  if (!student) {
    alert("Login required");
    window.location.href = "login.html";
    return;
  }

  // Fill student info
  document.getElementById("examName").innerText = student.name || "-";
  document.getElementById("examRoll").innerText = student.roll || "-";
  document.getElementById("examSubject").innerText = student.subject || "-";
  document.getElementById("examYear").innerText = student.year || "-";
  document.getElementById("examFather").innerText = student.father || "-";
  document.getElementById("examMother").innerText = student.mother || "-";
  document.getElementById("examDOB").innerText = student.dob || "-";

  const img = document.getElementById("examPhoto");
  img.src = `../assets/photos/${student.roll}.jpg`;
  img.onerror = () => {
    img.src = "../assets/photos/default.jpg";
  };

  // Load questions
  fetch("/api/questions")
    .then(res => res.json())
    .then(data => {
      questions = shuffle(data);
      showQuestion();
      startTimer();
    });
};

// Shuffle array randomly
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// Escape HTML (for options like <tr>, <td>, etc.)
function escapeHTML(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Show one question at a time
function showQuestion() {
  const q = questions[current];
  const box = document.getElementById("questionBox");

  box.innerHTML = `
    <h4>Q${current + 1} of ${questions.length}: ${escapeHTML(q.question)}</h4>
    ${q.options.map(opt => `
      <div class="option">
        <label>
          <input type="radio" name="opt" value="${opt}" ${answers[current] === opt ? 'checked' : ''}/> ${escapeHTML(opt)}
        </label>
      </div>
    `).join('')}
  `;

  document.querySelectorAll('input[name="opt"]').forEach(input => {
    input.onclick = () => {
      answers[current] = input.value;

      setTimeout(() => {
        if (current < questions.length - 1) {
          current++;
          showQuestion();
        } else {
          alert("✅ Last question reached. Click Submit to finish.");
        }
      }, 200);
    };
  });
}

// Skip question
function skipQuestion() {
  if (current < questions.length - 1) {
    current++;
    showQuestion();
  } else {
    alert("No more questions.");
  }
}

// Submit exam
function submitExam(force = false) {
  if (!force && !confirm("Submit your exam?")) return;

  let attempted = 0, correct = 0;

  questions.forEach((q, i) => {
    if (answers[i]) attempted++;
    if (answers[i] === q.answer) correct++;
  });

  fetch("/api/save-result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roll: student.roll,
      name: student.name,
      subject: student.subject,
      attempted,
      total: questions.length,
      correct,
      answers,
      questions,
      time: new Date().toLocaleString()
    })
  })
    .then(() => {
      alert(`✅ Result Submitted!\nTotal: ${questions.length}\nAttempted: ${attempted}\nCorrect: ${correct}`);
      window.location.href = "student.html";
    })
    .catch(err => {
      console.error("❌ Submission failed:", err);
      alert("Something went wrong while submitting your exam.");
    });
}

// Start timer
function startTimer() {
  updateTimer();
  timer = setInterval(() => {
    totalTime--;
    updateTimer();
    if (totalTime <= 0) {
      clearInterval(timer);
      alert("⏰ Time's up. Submitting your exam.");
      submitExam(true); // Force submit
    }
  }, 1000);
}

function updateTimer() {
  const min = Math.floor(totalTime / 60);
  const sec = totalTime % 60;
  document.getElementById("timer").innerText = `${min}:${sec < 10 ? '0' + sec : sec}`;
}

// Tab switch detection
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    tabSwitchCount++;
    if (tabSwitchCount === 1) {
      alert("⚠️ Switching tabs is not allowed. One more and your exam will be submitted.");
    } else {
      alert("❌ You switched again. Submitting your exam.");
      submitExam(true); // Force submit
    }
  }
});
