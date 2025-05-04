
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

const loginDiv = document.getElementById("login");
const dashboardDiv = document.getElementById("dashboard");
const chartsContainer = document.getElementById("charts");

auth.onAuthStateChanged(user => {
  if (user) {
    loginDiv.style.display = "none";
    dashboardDiv.style.display = "block";
    loadGraphs();
  } else {
    loginDiv.style.display = "block";
    dashboardDiv.style.display = "none";
  }
});

function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .catch(error => alert(error.message));
}

function signIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .catch(error => alert(error.message));
}

function signOut() {
  auth.signOut();
}

function submitScore() {
  const year = document.getElementById('year').value;
  const subject = document.getElementById('subject').value;
  const score = parseFloat(document.getElementById('score').value);
  const user = auth.currentUser;

  if (!year || !subject || isNaN(score)) {
    alert("Please fill in all fields correctly.");
    return;
  }

  const personalRef = db.ref(`userScores/${user.uid}/${year}/${subject}`);
  const sharedRef = db.ref(`results/${year}/${subject}`);

  const newEntry = {
    score: score,
    timestamp: Date.now(),
    uid: user.uid
  };

  personalRef.push(newEntry);
  sharedRef.push({ score: score });

  document.getElementById('score').value = '';
  loadGraphs(); // Refresh graphs
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
    const personalRef = db.ref(`userScores/${userId}/${year}/${subject}`);
    const sharedRef = db.ref(`results/${year}/${subject}`);

    Promise.all([
      personalRef.once('value'),
      sharedRef.once('value')
    ]).then(([userSnap, avgSnap]) => {
      const userData = userSnap.val();
      const allData = avgSnap.val();

      if (!userData) return;

      const userScores = Object.values(userData).map(entry => entry.score);
      const labels = userScores.map((_, i) => `Test ${i + 1}`);

      const avgScores = allData ? Object.values(allData).map(e => e.score) : [];
      const average = avgScores.length > 0 ? avgScores.reduce((a, b) => a + b, 0) / avgScores.length : 0;
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
              text: `${subject} (${year})`
            }
          }
        }
      });
    });
  });
}
