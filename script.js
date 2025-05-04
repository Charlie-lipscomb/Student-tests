
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, push, onValue, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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

const chartContainer = document.getElementById("chartsContainer");

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadUserScores(user.uid);
  }
});

document.getElementById("submitScore").addEventListener("click", () => {
  const subject = document.getElementById("subject").value;
  const year = document.getElementById("year").value;
  const score = parseInt(document.getElementById("score").value);

  const user = auth.currentUser;
  if (!user || !subject || !year || isNaN(score)) return;

  push(ref(db, `scores/${user.uid}`), {
    subject,
    year,
    score,
    timestamp: Date.now()
  }).then(() => {
    loadUserScores(user.uid);
  });
});

function loadUserScores(uid) {
  get(ref(db, `scores/${uid}`)).then((snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    // Group scores by subject
    const subjectMap = {};
    Object.values(data).forEach(entry => {
      if (!subjectMap[entry.subject]) subjectMap[entry.subject] = [];
      subjectMap[entry.subject].push(entry);
    });

    chartContainer.innerHTML = ""; // Clear old charts

    Object.keys(subjectMap).forEach(subject => {
      const entries = subjectMap[subject].sort((a, b) => a.timestamp - b.timestamp);
      const labels = entries.map(e => new Date(e.timestamp).toLocaleDateString());
      const scores = entries.map(e => e.score);

      const canvas = document.createElement("canvas");
      chartContainer.appendChild(canvas);

      new Chart(canvas, {
        type: "line",
        data: {
          labels: labels,
          datasets: [{
            label: subject,
            data: scores,
            borderColor: "rgba(0, 123, 255, 1)",
            fill: false,
            tension: 0.2
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              suggestedMax: 100
            }
          }
        }
      });
    });
  });
}
