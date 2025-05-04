
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

let currentUser = null;

auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    document.getElementById('form-section').style.display = 'block';
    loadGraphs();
  } else {
    currentUser = null;
    document.getElementById('form-section').style.display = 'none';
    document.getElementById('graphs').innerHTML = '';
  }
});

function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password).catch(alert);
}

function signIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password).catch(alert);
}

function signOut() {
  auth.signOut();
}

function submitScore() {
  const subject = document.getElementById("subject").value;
  const year = document.getElementById("year").value;
  const score = parseInt(document.getElementById("score").value);

  if (!subject || !year || isNaN(score)) return alert("Fill all fields");

  const ref = db.ref(`scores/${year}/${subject}/${currentUser.uid}`);
  ref.push(score).then(() => {
    loadGraphs();
  });
}

function loadGraphs() {
  const year = document.getElementById("year").value;
  if (!year) return;

  const container = document.getElementById("graphs");
  container.innerHTML = "";

  const subjects = [
    "Maths", "Biology", "Chemistry", "Physics", "English", "French", "German",
    "Italian", "Spanish", "Latin", "Greek", "Classical Civilisation",
    "Geography", "History", "Music", "Sport Science", "Computer Science", "TP", "Economics"
  ];

  subjects.forEach(subject => {
    db.ref(`scores/${year}/${subject}`).once("value", snapshot => {
      const data = snapshot.val();
      if (!data) return;

      let userScores = [];
      let allScores = [];

      for (const uid in data) {
        for (const scoreId in data[uid]) {
          const score = data[uid][scoreId];
          allScores.push(score);
          if (uid === currentUser.uid) {
            userScores.push(score);
          }
        }
      }

      if (userScores.length > 0) {
        const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;

        const canvas = document.createElement("canvas");
        container.appendChild(document.createElement("h3")).textContent = subject;
        container.appendChild(canvas);

        new Chart(canvas, {
          type: "line",
          data: {
            labels: userScores.map((_, i) => `Test ${i + 1}`),
            datasets: [
              {
                label: "Your Scores",
                data: userScores,
                borderColor: "blue",
                fill: false
              },
              {
                label: "Average Score",
                data: new Array(userScores.length).fill(avg),
                borderColor: "red",
                borderDash: [5, 5],
                fill: false
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    });
  });
}
