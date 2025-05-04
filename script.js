// Firebase Config (replace with your actual config)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

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
const auth = getAuth(app);
const db = getDatabase(app);

// DOM Elements
const authSection = document.getElementById("auth");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const logoutButton = document.getElementById("logout");
const subjectInput = document.getElementById("subject");
const yearInput = document.getElementById("year");
const scoreInput = document.getElementById("score");
const submitScoreBtn = document.getElementById("submit-score");
const graphsContainer = document.getElementById("graphs");

let currentUser = null;
const charts = {}; // Track charts per subject-year

// Auth Handlers
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert(error.message);
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert(error.message);
  }
});

logoutButton.addEventListener("click", () => {
  signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    authSection.style.display = "none";
    dashboard.style.display = "block";
    loadAllGraphs();
  } else {
    currentUser = null;
    authSection.style.display = "block";
    dashboard.style.display = "none";
  }
});

// Submit Score
submitScoreBtn.addEventListener("click", () => {
  const subject = subjectInput.value;
  const year = yearInput.value;
  const score = parseFloat(scoreInput.value);

  if (!subject || !year || isNaN(score) || !currentUser) return;

  const entryRef = push(
    ref(db, `scores/${subject}/${year}`)
  );
  set(entryRef, {
    uid: currentUser.uid,
    score,
    timestamp: Date.now(),
  });

  scoreInput.value = "";
});

// Load Graphs
function loadAllGraphs() {
  graphsContainer.innerHTML = "";

  const subjects = [
    "Maths", "Biology", "Chemistry", "Physics", "English", "French", "German",
    "Italian", "Spanish", "Latin", "Greek", "Classical Civilisation",
    "Geography", "History", "Music", "Sport Science", "Computer Science",
    "TP", "Economics"
  ];

  const years = ["7", "8", "9", "10", "11", "12", "13"];

  subjects.forEach((subject) => {
    years.forEach((year) => {
      const key = `${subject}-${year}`;
      const dataRef = ref(db, `scores/${subject}/${year}`);
      onValue(dataRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        const userScores = [];
        const userLabels = [];
        const allScores = [];

        Object.values(data).forEach((entry, index) => {
          allScores.push(entry.score);
          if (entry.uid === currentUser.uid) {
            userScores.push(entry.score);
            userLabels.push(`Test ${userScores.length}`);
          }
        });

        // Calculate average across ALL users for this subject and year
        let allScores = [];
        snapshot.forEach((userSnap) => {

          const userData = userSnap.val();
          if (userData.results) {
            Object.values(userData.results).forEach((test) => {
              if (test.subject === subject && test.year === year) {
                allScores.push(parseFloat(test.score));
              }
            });
          });

        const averageScore = allScores.length > 0
          ? allScores.reduce((a, b) => a + b, 0) / allScores.length
          : 0;
        // Create a flat line to match the number of user's test scores
        const averageScores = Array(userScores.length).fill(averageScore);

        // Update or create chart
        if (charts[key]) {
          charts[key].data.labels = userLabels;
          charts[key].data.datasets[0].data = userScores;
          charts[key].data.datasets[1].data = averageScores;
          charts[key].update();
        } else if (userScores.length > 0) {
          const section = document.createElement("div");
          section.className = "graph-section";
          const title = document.createElement("h4");
          title.textContent = `${subject} - Year ${year}`;
          const canvas = document.createElement("canvas");
          section.appendChild(title);
          section.appendChild(canvas);
          graphsContainer.appendChild(section);
          const ctx = canvas.getContext("2d");
          charts[key] = new Chart(ctx, {
            type: "line",
            data: {
              labels: userLabels,
              datasets: [
                {
                  label: "Your Scores",
                  data: userScores,
                  borderColor: "blue",
                  fill: false,
                },
                {
                  label: "Average Score",
                  data: averageScores,
                  borderColor: "red",
                  borderDash: [5, 5],
                  fill: false,
                },
              ],
            },
            options: {
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: `${subject} - Year ${year}`,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                },
              },
            },
          });
        }
      });
    });
  });
}
