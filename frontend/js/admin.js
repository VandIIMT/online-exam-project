// ========== Student Management ==========

function addStudent() {
  const student = {
    roll: document.getElementById('roll').value,
    name: document.getElementById('name').value,
    father: document.getElementById('father').value,
    mother: document.getElementById('mother').value,
    dob: document.getElementById('dob').value,
    subject: document.getElementById('subject').value,
    year: document.getElementById('year').value
  };

  fetch('/api/student', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student)
  })
    .then(res => res.json())
    .then(data => {
      alert(data.success ? 'Student saved.' : 'Failed.');
      loadStudents();
    });
}

function loadStudents() {
  fetch('/api/all-students')
    .then(res => res.json())
    .then(data => {
      const div = document.getElementById('studentTable');
      div.innerHTML = '';
      data.forEach((s, i) => {
        div.innerHTML += `
          <div class="student-row">
            <b>${s.roll}</b> - ${s.name} (${s.subject})<br>
            Year: ${s.year}, DOB: ${s.dob || '-'}<br>
            <button onclick="editStudent(${i})">Edit</button>
            <button onclick="deleteStudent('${s.roll}')">Delete</button>
          </div>
        `;
      });
    });
}

function deleteStudent(roll) {
  if (!confirm("Are you sure to delete this student?")) return;
  fetch(`/api/delete-student/${roll}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(() => loadStudents());
}

function editStudent(index) {
  fetch('/api/all-students')
    .then(res => res.json())
    .then(students => {
      const s = students[index];
      const html = `
        <h4>Edit Student (${s.roll})</h4>
        <input value="${s.name}" id="editName">
        <input value="${s.father}" id="editFather">
        <input value="${s.mother}" id="editMother">
        <input value="${s.dob}" type="date" id="editDob">
        <input value="${s.subject}" id="editSubject">
        <input value="${s.year}" id="editYear">
        <button onclick="saveEdit('${s.roll}')">Save</button>
      `;
      document.getElementById('studentTable').innerHTML = html;
    });
}

function saveEdit(roll) {
  const student = {
    roll,
    name: document.getElementById('editName').value,
    father: document.getElementById('editFather').value,
    mother: document.getElementById('editMother').value,
    dob: document.getElementById('editDob').value,
    subject: document.getElementById('editSubject').value,
    year: document.getElementById('editYear').value
  };

  fetch('/api/student', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student)
  })
    .then(res => res.json())
    .then(() => {
      alert("Updated.");
      loadStudents();
    });
}

// ========== Upload Student File ==========

function uploadStudents() {
  const file = document.getElementById('studentFile').files[0];
  if (!file) return alert("Choose a file");

  const reader = new FileReader();
  reader.onload = () => {
    const lines = reader.result.split('\n').filter(Boolean);
    const students = lines.map(line => {
      const [roll, name, father, mother, dob, subject, year] = line.trim().split(',');
      return { roll, name, father, mother, dob, subject, year };
    });

    fetch("/api/upload-students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(students)
    })
      .then(res => res.json())
      .then(() => {
        alert("Student file uploaded.");
        loadStudents();
      });
  };
  reader.readAsText(file);
}

// ========== Question Management ==========

function uploadQuestions() {
  const file = document.getElementById('questionFile').files[0];
  if (!file) return alert("Select a file.");

  const reader = new FileReader();

  if (file.name.endsWith('.txt')) {
    reader.onload = () => {
      const lines = reader.result.split('\n').filter(Boolean);
      const questions = lines.map(line => {
        const [question, opt1, opt2, opt3, opt4, answer] = line.trim().split('|');
        return {
          question,
          options: [opt1, opt2, opt3, opt4],
          answer
        };
      });
      saveQuestionData(questions);
    };
    reader.readAsText(file);
  }

  if (file.name.endsWith('.xlsx')) {
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      const questions = json.map(row => ({
        question: row.Question,
        options: [row.Option1, row.Option2, row.Option3, row.Option4],
        answer: row.Answer
      }));
      saveQuestionData(questions);
    };
    reader.readAsArrayBuffer(file);
  }
}

function saveQuestionData(questions) {
  fetch('/api/upload-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(questions)
  }).then(() => {
    alert("Questions uploaded.");
    loadQuestions();
  });
}

function loadQuestions() {
  fetch('/api/questions')
    .then(res => res.json())
    .then(data => {
      const div = document.getElementById('questionTable');
      div.innerHTML = '';
      data.forEach((q, i) => {
        div.innerHTML += `
          <div class="question-row">
            <b>Q${i + 1}</b>: ${q.question}<br>
            A: ${q.options[0]} | B: ${q.options[1]} | C: ${q.options[2]} | D: ${q.options[3]}<br>
            ✅ Answer: ${q.answer}<br>
            <button onclick="editQuestion(${i})">Edit</button>
            <button onclick="deleteQuestion(${i})">Delete</button>
          </div>
        `;
      });
    });
}

function editQuestion(index) {
  fetch('/api/questions')
    .then(res => res.json())
    .then(data => {
      const q = data[index];
      document.getElementById("questionTable").innerHTML = `
        <h4>Edit Question</h4>
        <textarea id="editQ">${q.question}</textarea>
        <input id="opt1" value="${q.options[0]}">
        <input id="opt2" value="${q.options[1]}">
        <input id="opt3" value="${q.options[2]}">
        <input id="opt4" value="${q.options[3]}">
        <input id="ans" value="${q.answer}">
        <button onclick="saveQuestion(${index})">Save</button>
      `;
    });
}

function saveQuestion(index) {
  const updated = {
    question: document.getElementById("editQ").value,
    options: [
      document.getElementById("opt1").value,
      document.getElementById("opt2").value,
      document.getElementById("opt3").value,
      document.getElementById("opt4").value
    ],
    answer: document.getElementById("ans").value
  };

  fetch(`/api/edit-question/${index}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updated)
  }).then(() => {
    alert("Question updated.");
    loadQuestions();
  });
}

function deleteQuestion(index) {
  if (!confirm("Delete question?")) return;
  fetch(`/api/delete-question/${index}`, { method: "DELETE" })
    .then(() => {
      alert("Deleted.");
      loadQuestions();
    });
}

// ========== Result Management ==========

function loadResults() {
  fetch('/api/results')
    .then(res => res.json())
    .then(files => {
      const container = document.getElementById('resultsContainer');
      const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
      container.innerHTML = '';

      files
        .filter(f => f.toLowerCase().includes(keyword))
        .forEach(file => {
          container.innerHTML += `
            <div class="student-row">
              ${file}
              <button onclick="downloadResult('${file}')">Download</button>
              <button onclick="deleteResult('${file}')">Delete</button>
            </div>
          `;
        });

      if (container.innerHTML === '') {
        container.innerHTML = `<p>No matching results found.</p>`;
      }
    });
}

function downloadResult(file) {
  window.open(`/api/download-result/${file}`, '_blank');
}

function deleteResult(file) {
  if (!confirm("Delete this result file?")) return;
  fetch(`/api/delete-result/${file}`, { method: "DELETE" })
    .then(() => {
      alert("Result deleted.");
      loadResults();
    });
}

function downloadAllResults() {
  window.open("/api/download-all-results", "_blank");
}

// ========== Init Load ==========

window.onload = function () {
  loadStudents();
  loadQuestions();
  loadResults();
  
   document.getElementById("searchInput").addEventListener("input", loadResults);
};
function toggleStudents() {
  const box = document.getElementById("studentTable");
  box.style.display = box.style.display === "none" ? "block" : "none";
}

function toggleQuestions() {
  const box = document.getElementById("questionTable");
  box.style.display = box.style.display === "none" ? "block" : "none";
}
