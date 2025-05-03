// Initialize Firebase
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
const database = firebase.database();

const subjects = [
  "Maths", "Biology", "Chemistry", "Physics", "English", "French", "German",
  "Italian", "Spanish", "Latin", "Greek", "Classical Civilisation",
  "Geography", "History", "Music", "Sport Science", "Computer Science", "TP", "Economics"
];

let charts = {}; // Store Chart.js instances

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("login").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    fetchAndDisplayScoresRealtime();
  } else {
    document.getElementById("login").style.display = "block";
    document.getElementById("dashboard").style.display = "none";
  }
});

// Sign up
document.getElementById("signup-btn").onclick = () => {
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  auth.createUserWithEmailAndPassword(email, password).catch(console.error);
};

// Log in
document.getElementById("login-btn").onclick = () => {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  auth.signInWithEmailAndPassword(email, password).catch(console.error);
};

// Log out
document.getElementById("logout-btn").onclick = () => auth.signOut();

// Submit a new score
document.getElementById("submit-score").onclick = () => {
  const user = auth.currentUser;
  const subject = document.getElementById("subject").value;
  const score = parseFloat(document.getElementById("score").value);

  if (!user || !subject || isNaN(score)) {
    alert("Fill in all fields properly.");
    return;
  }

  const timestamp = Date.now();
  const scoreData = { score, timestamp };

  database.ref(`scores/${user.uid}/${subject}`).push(scoreData)
    .then(() => {
      document.getElementById("score").value = "";
      fetchAndDisplayScoresRealtime();
    })
    .catch(console.error);
};

// Fetch user scores and update graphs
function fetchAndDisplayScoresRealtime() {
  const user = auth.currentUser;
  if (!user) return;

  subjects.forEach(subject => {
    const userRef = database.ref(`scores/${user.uid}/${subject}`);
    const allRef = database.ref(`scores`);

    userRef.once("value", snapshot => {
      const labels = [];
      const userScores = [];

      snapshot.forEach(child => {
        const data = child.val();
        userScores.push(data.score);
        labels.push(new Date(data.timestamp).toLocaleDateString());
      });

      // Compute average across all users
      let total = 0, count = 0;
      allRef.once("value", allSnap => {
        allSnap.forEach(userSnap => {
          const subjSnap = userSnap.child(subject);
          subjSnap.forEach(scoreSnap => {
            const scoreVal = scoreSnap.val().score;
            total += scoreVal;
            count++;
          });
        });

        const average = count ? (total / count) : 0;
        const avgLine = Array(userScores.length).fill(average);

        drawChart(subject, labels, userScores, avgLine);
      });
    });
  });
}

// Draw chart
function drawChart(subject, labels, userData, avgData) {
  const canvasId = `${subject}Chart`;
  const ctx = document.getElementById(canvasId)?.getContext("2d");
  if (!ctx) return;

  // Destroy previous chart
  if (charts[subject]) {
    charts[subject].destroy();
  }

  charts[subject] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: `${subject} - Your Scores`,
          data: userData,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: false,
          tension: 0.2
        },
        {
          label: `${subject} - Average`,
          data: avgData,
          borderColor: 'rgba(255, 99, 132, 1)',
          borderDash: [5, 5],
          fill: false,
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `${subject} Scores Over Time`
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}
