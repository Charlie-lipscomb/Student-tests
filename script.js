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

const loginDiv = document.getElementById("login");
const dashboard = document.getElementById("dashboard");

const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");

document.getElementById("login-btn").addEventListener("click", () => {
  auth.signInWithEmailAndPassword(loginEmail.value, loginPassword.value)
    .then(() => showDashboard())
    .catch(err => alert(err.message));
});

document.getElementById("signup-btn").addEventListener("click", () => {
  auth.createUserWithEmailAndPassword(signupEmail.value, signupPassword.value)
    .then(() => showDashboard())
    .catch(err => alert(err.message));
});

document.getElementById("logout-btn").addEventListener("click", () => {
  auth.signOut();
  loginDiv.style.display = "block";
  dashboard.style.display = "none";
});

auth.onAuthStateChanged(user => {
  if (user) showDashboard();
});

function showDashboard() {
  loginDiv.style.display = "none";
  dashboard.style.display = "block";
  loadUserScores();
}

document.getElementById("submit-score").addEventListener("click", () => {
  const user = auth.currentUser;
  const subject = document.getElementById("subject").value;
  const year = document.getElementById("year").value;
  const score = parseInt(document.getElementById("score").value);

  if (!subject || !year || isNaN(score)) {
    alert("Please complete all fields.");
    return;
  }

  const scoreData = {
    subject,
    year,
    score,
    timestamp: Date.now()
  };

  database.ref("scores/" + user.uid).push(scoreData).then(() => {
    loadUserScores();
  });
});

function loadUserScores() {
  const user = auth.currentUser;
  database.ref("scores/" + user.uid).once("value", snapshot => {
    const scores = snapshot.val() || {};
    const subjectMap = {};

    Object.values(scores).forEach(entry => {
      if (!subjectMap[entry.subject]) {
        subjectMap[entry.subject] = { labels: [], data: [] };
      }
      const date = new Date(entry.timestamp).toLocaleDateString();
      subjectMap[entry.subject].labels.push(date);
      subjectMap[entry.subject].data.push(entry.score);
    });

    renderCharts(subjectMap);
  });
}

function renderCharts(subjectMap) {
  const container = document.getElementById("charts");
  container.innerHTML = "";

  Object.keys(subjectMap).forEach(subject => {
    const chartCanvas = document.createElement("canvas");
    container.appendChild(chartCanvas);

    new Chart(chartCanvas, {
      type: "line",
      data: {
        labels: subjectMap[subject].labels,
        datasets: [{
          label: `${subject} Score`,
          data: subjectMap[subject].data,
          borderColor: "blue",
          backgroundColor: "lightblue",
          fill: false,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: subject
          }
        }
      }
    });
  });
}
