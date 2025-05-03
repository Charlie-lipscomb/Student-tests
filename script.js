// Auth state listener
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("app-section").style.display = "block";
    fetchAndDisplayScores();
  } else {
    document.getElementById("auth-section").style.display = "block";
    document.getElementById("app-section").style.display = "none";
  }
});

function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .catch(e => alert(e.message));
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .catch(e => alert(e.message));
}

function logout() {
  auth.signOut();
}

function submitScore() {
  const user = auth.currentUser;
  const subject = document.getElementById("subject").value;
  const year = document.getElementById("year").value;
  const score = parseFloat(document.getElementById("score").value);

  if (!user || !subject || !year || isNaN(score)) {
    alert("Please fill in all fields correctly.");
    return;
  }

  db.collection("scores").add({
    uid: user.uid,
    subject,
    year,
    score,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    fetchAndDisplayScores();
  }).catch((error) => {
    console.error("Error adding score: ", error);
    alert("Failed to submit score.");
  });
}

let chart;

function fetchAndDisplayScores() {
  const user = auth.currentUser;
  if (!user) return;

  db.collection("scores")
    .where("uid", "==", user.uid)
    .orderBy("timestamp")
    .get()
    .then(snapshot => {
      const labels = [];
      const scores = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const date = data.timestamp?.toDate().toLocaleDateString() || "Unknown";
        labels.push(`${data.subject} (${date})`);
        scores.push(data.score);
      });

      drawChart(labels, scores);

      // Fetch average score for all users
      db.collection("scores").get().then(allSnapshot => {
        let total = 0, count = 0;
        allSnapshot.forEach(doc => {
          const s = doc.data().score;
          if (!isNaN(s)) {
            total += s;
            count++;
          }
        });
        const average = count > 0 ? (total / count).toFixed(2) : "N/A";
        document.getElementById("averageText").innerText =
          `Overall Average Score: ${average}%`;
      });
    });
}

function drawChart(labels, scores) {
  const ctx = document.getElementById("scoreChart").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Your Scores",
        data: scores,
        backgroundColor: "rgba(33, 150, 243, 0.2)",
        borderColor: "#2196f3",
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#2196f3"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}
