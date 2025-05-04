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
const db = firebase.database();

let currentUser = null;
let chart = null;

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    document.getElementById("auth").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("userEmail").innerText = user.email;
    updateChart();
  } else {
    currentUser = null;
    document.getElementById("auth").style.display = "block";
    document.getElementById("dashboard").style.display = "none";
  }
});

function signUp() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, pass).catch(alert);
}

function login() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, pass).catch(alert);
}

function logout() {
  auth.signOut();
}

function submitScore() {
  const subject = document.getElementById("subject").value;
  const year = document.getElementById("year").value;
  const score = parseFloat(document.getElementById("score").value);

  if (!subject || !year || isNaN(score)) {
    alert("Please complete all fields.");
    return;
  }

  const userId = currentUser.uid;
  const timestamp = Date.now();

  db.ref(`scores/${userId}/${subject}/${timestamp}`).set({
    score,
    year
  }).then(updateChart);
}

function updateChart() {
  const subject = document.getElementById("subject").value;
  if (!subject || !currentUser) return;

  const userId = currentUser.uid;

  db.ref("scores").once("value").then((snapshot) => {
    const allData = snapshot.val();
    const userScores = [];
    const allScores = [];

    for (let uid in allData) {
      if (allData[uid][subject]) {
        for (let ts in allData[uid][subject]) {
          const entry = allData[uid][subject][ts];
          if (uid === userId) userScores.push(entry.score);
          allScores.push(entry.score);
        }
      }
    }

    renderChart(userScores, allScores, subject);
  });
}

function renderChart(userData, avgData, subject) {
  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("scoreChart").getContext("2d"), {
    type: "line",
    data: {
      labels: userData.map((_, i) => `Test ${i + 1}`),
      datasets: [
        {
          label: "Your Scores",
          data: userData,
          borderColor: "blue",
          fill: false
        },
        {
          label: "Class Average",
          data: Array(userData.length).fill(
            avgData.reduce((a, b) => a + b, 0) / (avgData.length || 1)
          ),
          borderColor: "orange",
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `Scores for ${subject}`
        }
      }
    }
  });
}
