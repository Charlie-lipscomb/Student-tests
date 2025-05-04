
const firebaseConfig = {
  apiKey: "AIzaSyDWZ3NbTOaRoUjh7stKklyCiBDWH4mdRC0",
  authDomain: "student-tests-f85fd.firebaseapp.com",
  databaseURL: "https://student-tests-f85fd-default-rtdb.firebaseio.com",
  projectId: "student-tests-f85fd",
  storageBucket: "student-tests-f85fd.firebasestorage.app",
  messagingSenderId: "878760132447",
  appId: "1:878760132447:web:fad870bd99112df6e0c0ea",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

const authContainer = document.getElementById('auth-container');
const dashboard = document.getElementById('dashboard');
const chartsContainer = document.getElementById('charts-container');

function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => showDashboard())
    .catch(e => document.getElementById('auth-message').innerText = e.message);
}

function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => showDashboard())
    .catch(e => document.getElementById('auth-message').innerText = e.message);
}

function showDashboard() {
  authContainer.style.display = 'none';
  dashboard.style.display = 'block';
  loadGraphs();
}

function submitScore() {
  const year = document.getElementById('year').value;
  const subject = document.getElementById('subject').value;
  const score = parseFloat(document.getElementById('score').value);
  const user = auth.currentUser;

  if (user && year && subject && !isNaN(score)) {
    const ref = db.ref(`results/${year}/${subject}`);
    ref.push({ uid: user.uid, score: score }).then(loadGraphs);
  }
}

function loadGraphs() {
  const year = document.getElementById('year').value;
  chartsContainer.innerHTML = '';
  if (!year) return;

  const subjects = [
    "Maths", "Biology", "Chemistry", "Physics", "English", "French", "German",
    "Italian", "Spanish", "Latin", "Greek", "Classical Civilisation",
    "Geography", "History", "Music", "Sport Science", "Computer Science", "TP", "Economics"
  ];

  const userId = auth.currentUser.uid;

  subjects.forEach(subject => {
    const ref = db.ref(`results/${year}/${subject}`);
    ref.once('value', snapshot => {
      const data = snapshot.val();
      if (!data) return;

      const labels = [];
      const userScores = [];
      const allScores = [];

      let userIndex = 0;
      let globalIndex = 0;

      Object.values(data).forEach(entry => {
        allScores.push(entry.score);
        if (entry.uid === userId) {
          labels.push("Test " + (++userIndex));
          userScores.push(entry.score);
        }
      });

      const average = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      const avgLine = new Array(userScores.length).fill(average);

      const canvas = document.createElement('canvas');
      chartsContainer.appendChild(document.createElement('h4')).innerText = `${subject} - ${year}`;
      chartsContainer.appendChild(canvas);

      new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Your Scores',
              data: userScores,
              borderColor: 'blue',
              fill: false
            },
            {
              label: 'Average Score',
              data: avgLine,
              borderColor: 'orange',
              borderDash: [5, 5],
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true },
            title: {
              display: true,
              text: `${subject} Scores`
            }
          }
        }
      });
    });
  });
}

auth.onAuthStateChanged(user => {
  if (user) showDashboard();
});
