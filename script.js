auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
    loadScores(user.uid);
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
  const uid = auth.currentUser.uid;
  if (!isNaN(score)) {
    db.collection("scores").add({
      uid: uid,
      score: score,
      timestamp: new Date()
    }).then(() => {
      document.getElementById("score").value = "";
    });
  }
}

function loadScores(uid) {
  db.collection("scores")
    .where("uid", "==", uid)
    .orderBy("timestamp")
    .onSnapshot(snapshot => {
      const scores = [];
      const labels = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        scores.push(data.score);
        labels.push(new Date(data.timestamp.toDate()).toLocaleDateString());
      });
      drawChart(labels, scores);
    });
}

let chart;
function drawChart(labels, data) {
  const ctx = document.getElementById('scoreChart').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Test Scores',
        data: data,
        borderColor: '#0d6efd',
        fill: false,
        tension: 0.1
      }]
    }
  });
}
