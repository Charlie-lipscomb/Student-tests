

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  push,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDWZ3NbTOaRoUjh7stKklyCiBDWH4mdRC0",
  authDomain: "student-tests-f85fd.firebaseapp.com",
  databaseURL: "https://student-tests-f85fd-default-rtdb.firebaseio.com",
  projectId: "student-tests-f85fd",
  storageBucket: "student-tests-f85fd.firebasestorage.app",
  messagingSenderId: "878760132447",
  appId: "1:878760132447:web:fad870bd99112df6e0c0ea",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase(app);

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const dashboard = document.getElementById("dashboard");
const logoutBtn = document.getElementById("logout");
const submitScoreBtn = document.getElementById("submit-score");

const subjectSelect = document.getElementById("subject");
const yearSelect = document.getElementById("year");
const scoreInput = document.getElementById("score");
const graphsContainer = document.getElementById("graphs");

signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = signupForm["signup-email"].value;
  const password = signupForm["signup-password"].value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      signupForm.reset();
    })
    .catch((err) => alert(err.message));
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = loginForm["login-email"].value;
  const password = loginForm["login-password"].value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      loginForm.reset();
    })
    .catch((err) => alert(err.message));
});

logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("auth").style.display = "none";
    dashboard.style.display = "block";
    loadGraphs(user.uid);
  } else {
    document.getElementById("auth").style.display = "block";
    dashboard.style.display = "none";
  }
});

submitScoreBtn.addEventListener("click", () => {
  const subject = subjectSelect.value.trim();
  const year = yearSelect.value.trim();
  const score = parseFloat(scoreInput.value);
  const user = auth.currentUser;

  if (!subject || !year || isNaN(score)) {
    alert("Please select subject, year, and enter a score.");
    return;
  }

  const subjectYear = `${subject}_${year}`;
  const userRef = ref(db, `results/${user.uid}/${subjectYear}`);
  const allRef = ref(db, `allResults/${subjectYear}`);

  const newResult = {
    score: score,
    timestamp: Date.now()
  };

  push(userRef, newResult);
  push(allRef, newResult);

  scoreInput.value = "";
  loadGraphs(user.uid);
});

function loadGraphs(userId) {
  graphsContainer.innerHTML = "";

  const userResultsRef = ref(db, `results/${userId}`);
  onValue(userResultsRef, (snapshot) => {
    graphsContainer.innerHTML = "";
    const userData = snapshot.val();
    if (!userData) return;

    Object.entries(userData).forEach(([subjectYear, entries]) => {
      const [subject, year] = subjectYear.split("_");

      const labels = [];
      const scores = [];

      Object.values(entries).forEach((entry) => {
        labels.push(new Date(entry.timestamp).toLocaleDateString());
        scores.push(entry.score);
      });

      const graphContainer = document.createElement("div");
      graphContainer.classList.add("graph-block");

      const title = document.createElement("h3");
      title.textContent = `${subject} - ${year}`;
      graphContainer.appendChild(title);

      const canvas = document.createElement("canvas");
      graphContainer.appendChild(canvas);

      graphsContainer.appendChild(graphContainer);

      // Fetch global average
      const allResultsRef = ref(db, `allResults/${subjectYear}`);
      onValue(allResultsRef, (avgSnap) => {
        const allScores = [];
        Object.values(avgSnap.val() || {}).forEach((entry) => {
          allScores.push(entry.score);
        });

        const average = allScores.length > 0
          ? allScores.reduce((a, b) => a + b, 0) / allScores.length
          : 0;

        const averageData = Array(scores.length).fill(average);

        new Chart(canvas, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: "Your Scores",
                data: scores,
                borderColor: "#007bff",
                fill: false
              },
              {
                label: "Average Score",
                data: averageData,
                borderColor: "#ff9900",
                borderDash: [5, 5],
                fill: false
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        });
      });
    });
  });
}
