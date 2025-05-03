auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
  } else {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('app-section').style.display = 'none';
  }
});

function login() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, pass).catch(err => alert(err.message));
}

function signup() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, pass).catch(err => alert(err.message));
}

function logout() {
  auth.signOut();
}

function submitScore() {
  const score = parseInt(document.getElementById("score").value);
  const subject = document.getElementById("subject").value;
  const year = document.getElementById("year").value;
  const uid = auth.currentUser.uid;

  if (!subject || !year || isNaN(score)) {
    alert("Please complete all fields.");
    return;
  }

  db.collection("scores").add({
    uid,
    score,
    subject,
    year,
    timestamp: new Date()
  }).then(() => {
    document.getElementById("score").value = "";
    loadScores(subject, year);
  });
}

let chart;

function loadScores(subject, year) {
  const uid = auth.currentUser.uid;

  db.collection("scores")
    .where("uid", "==", uid)
    .where("subject", "==", subject)
    .where("year", "==", year)
    .orderBy("timestamp")
    .get()
    .then(snapshot => {
      const labels = [];
      const scores = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        labels.push(new Date(data.timestamp.toDate()).toLocaleDateString());
        scores.push(data.score);
      });

      if (chart) chart.destroy();
      const ctx = document.getElementById("scoreChart").getContext("2d");
      chart = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Your Scores",
            data: scores,
            borderColor: "#0d6efd",
            fill: false,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, max: 100 }
          }
        }
      });

      loadAverage(subject, year);
    });
}

function loadAverage(subject, year) {
  db.collection("scores")
    .where("subject", "==", subject)
    .where("year", "==", year)
    .get()
    .then(snapshot => {
      const allScores = snapshot.docs.map(doc => doc.data().score);
      const avg =
        allScores.length > 0
          ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)
          : "N/A";

      document.getElementById("averageText").innerText = `Average for ${year} ${subject}: ${avg}%`;
    });
}

// Auto load on subject/year change
document.getElementById("subject").addEventListener("change", () => {
  const subject = document.getElementById("subject").value;
  const year = document.getElementById("year").value;
  if (subject && year) loadScores(subject, year);
});

document.getElementById("year").addEventListener("change", () => {
  const subject = document.getElementById("subject").value;
  const year = document.getElementById("year").value;
  if (subject && year) loadScores(subject, year);
});
