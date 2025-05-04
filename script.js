
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

const authSection = document.getElementById("auth-section");
const dashboard = document.getElementById("dashboard");
const chartsContainer = document.getElementById("charts-container");

function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => document.getElementById("auth-status").textContent = "Signed up!")
    .catch(err => document.getElementById("auth-status").textContent = err.message);
}

function signIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById("auth-status").textContent = "Logged in!";
    })
    .catch(err => document.getElementById("auth-status").textContent = err.message);
}

function signOut() {
  auth.signOut().then(() => location.reload());
}

auth.onAuthStateChanged(user => {
  if (user) {
    authSection.style.display = "none";
    dashboard.style.display = "block";
    loadUserData(user.uid);
  } else {
    authSection.style.display = "block";
    dashboard.style.display = "none";
  }
});

function submitResult() {
  const year = document.getElementById("year").value;
  const subject = document.getElementById("subject").value;
  const score = parseFloat(document.getElementById("score").value);
  const user = auth.currentUser;

  if (!year || !subject || isNaN(score) || !user) return;

  const resultRef = db.ref(`results/${user.uid}/${subject}_${year}`).push();
  resultRef.set({
    score,
    timestamp: Date.now()
  });

  // Also store for global average
  const avgRef = db.ref(`allResults/${subject}_${year}`).push();
  avgRef.set({
    score,
    timestamp: Date.now()
  });
}

function loadUserData(uid) {
  chartsContainer.innerHTML = "";

  db.ref(`results/${uid}`).on("value", snapshot => {
    chartsContainer.innerHTML = "";

    const data = snapshot.val();
    if (!data) return;

    Object.keys(data).forEach(subjectYear => {
      const scores = [];
      const labels = [];
      Object.values(data[subjectYear]).forEach((entry, i) => {
        scores.push(entry.score);
        labels.push(`Test ${i + 1}`);
      });

      // Create chart canvas
      const canvas = document.createElement("canvas");
      chartsContainer.appendChild(document.createElement("hr"));
      chartsContainer.appendChild(document.createTextNode(subjectYear));
      chartsContainer.appendChild(canvas);

      // Fetch average
      db.ref(`allResults/${subjectYear}`).once("value", avgSnap => {
        const allScores = Object.values(avgSnap.val() || {}).map(d => d.score);
        const avg = allScores.reduce((a, b) => a + b, 0) / (allScores.length || 1);
        const avgLine = Array(scores.length).fill(avg);

        new Chart(canvas.getContext("2d"), {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: "Your Scores",
                data: scores,
                borderColor: "blue",
                fill: false
              },
              {
                label: "Average Score",
                data: avgLine,
                borderColor: "red",
                borderDash: [5, 5],
                fill: false
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: {
                display: true,
                text: `Subject: ${subjectYear}`
              }
            }
          }
        });
      });
    });
  });
}
