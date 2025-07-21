const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const archiver = require('archiver');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve login.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'html', 'login.html'));
});

// Paths
const studentsPath = path.join(__dirname, 'students.json');
const questionsPath = path.join(__dirname, 'questions.json');
const resultsDir = path.join(__dirname, 'results');

// Helpers
function loadStudents() {
  try {
    return JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
  } catch {
    return [];
  }
}
function saveStudents(data) {
  fs.writeFileSync(studentsPath, JSON.stringify(data, null, 2));
}

// 🔐 Login System
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin@123') {
    return res.json({ success: true, redirect: '/html/admin.html' });
  }

  const students = loadStudents();
  const student = students.find(s => s.roll === username);
  if (!student) return res.json({ success: false });

  if (!student.password && password === 'vrl@123') {
    return res.json({ success: true, forceReset: true });
  }

  if (student.password === password) {
    return res.json({
      success: true,
      redirect: '/html/student.html',
      student: {
        roll: student.roll,
        name: student.name,
        father: student.father,
        mother: student.mother,
        dob: student.dob,
        subject: student.subject,
        year: student.year,
        photo: student.photo
      }
    });
  }

  res.json({ success: false });
});

app.post('/api/update-password', (req, res) => {
  const { roll, newPassword } = req.body;
  const students = loadStudents();
  const student = students.find(s => s.roll === roll);
  if (!student) return res.json({ success: false });

  student.password = newPassword;
  saveStudents(students);
  res.json({ success: true });
});

// 👥 Student Management
app.post('/api/student', (req, res) => {
  const newStu = req.body;
  const students = loadStudents();
  const idx = students.findIndex(s => s.roll === newStu.roll);
  if (idx !== -1) students[idx] = { ...students[idx], ...newStu };
  else students.push(newStu);
  saveStudents(students);
  res.json({ success: true });
});

app.post('/api/upload-students', (req, res) => {
  const newStudents = req.body;
  const students = loadStudents();
  newStudents.forEach(stu => {
    const idx = students.findIndex(s => s.roll === stu.roll);
    if (idx !== -1) students[idx] = { ...students[idx], ...stu };
    else students.push(stu);
  });
  saveStudents(students);
  res.json({ success: true });
});

app.get('/api/all-students', (req, res) => {
  res.json(loadStudents());
});

app.delete('/api/delete-student/:roll', (req, res) => {
  let students = loadStudents();
  const idx = students.findIndex(s => s.roll === req.params.roll);
  if (idx === -1) return res.json({ success: false });
  students.splice(idx, 1);
  saveStudents(students);
  res.json({ success: true });
});

// ❓ Question Management
app.post('/api/upload-questions', (req, res) =>
  fs.writeFile(questionsPath, JSON.stringify(req.body, null, 2), err =>
    res.json({ success: !err })
  )
);

app.get('/api/questions', (req, res) => {
  try {
    res.json(JSON.parse(fs.readFileSync(questionsPath, 'utf8')));
  } catch {
    res.json([]);
  }
});

app.post('/api/edit-question/:index', (req, res) => {
  const idx = parseInt(req.params.index);
  const data = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
  if (idx < 0 || idx >= data.length) return res.json({ success: false });
  data[idx] = req.body;
  fs.writeFileSync(questionsPath, JSON.stringify(data, null, 2));
  res.json({ success: true });
});

app.delete('/api/delete-question/:index', (req, res) => {
  const idx = parseInt(req.params.index);
  const data = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
  if (idx < 0 || idx >= data.length) return res.json({ success: false });
  data.splice(idx, 1);
  fs.writeFileSync(questionsPath, JSON.stringify(data, null, 2));
  res.json({ success: true });
});

// 📊 Save Exam Result (Full Summary)
app.post('/api/save-result', (req, res) => {
  const { roll, name, subject, attempted, total, correct, answers, questions, time } = req.body;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `result-${roll}-${timestamp}.txt`;
  const filepath = path.join(resultsDir, filename);

  const content = `
Roll No: ${roll}
Name: ${name}
Subject: ${subject}
Attempted: ${attempted}
Total: ${total}
Correct: ${correct}
Time: ${time}


Questions and Answers:
${questions.map((q, i) => {
    const selected = answers[i] || "Not Answered";
    return `Q${i + 1}: ${q.question}
Your Answer: ${selected}
Correct Answer: ${q.answer}\n`;
  }).join('\n')}
`;

  fs.writeFile(filepath, content, err => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

// 📂 View / Download / Delete Results
app.get('/api/results', (req, res) =>
  fs.readdir(resultsDir, (err, files) =>
    res.json(err ? [] : files.filter(f => f.endsWith('.txt')))
  )
);

app.get('/api/download-result/:filename', (req, res) => {
  const file = path.join(resultsDir, req.params.filename);
  if (fs.existsSync(file)) res.download(file);
  else res.status(404).send('File not found');
});

app.delete('/api/delete-result/:filename', (req, res) => {
  const file = path.join(resultsDir, req.params.filename);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// 📦 ZIP Download
app.get('/api/download-all-results', (req, res) => {
  const zipFile = path.join(__dirname, 'all-results.zip');
  const output = fs.createWriteStream(zipFile);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => res.download(zipFile));
  archive.on('error', err => res.status(500).send({ error: err.message }));

  archive.pipe(output);
  archive.directory(resultsDir, false);
  archive.finalize();
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
