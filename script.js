
// Firebase config - replace with your own!
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let chart;

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    document.getElementById("userEmail").textContent = user.email;
    updateChart();
  } else {
    document.getElementById("auth-section").style.display = "block";
    document.getElementById("dashboard").style.display = "none";
  }
});

function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password).catch(alert);
}

function logIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password).catch(alert);
}

function logOut() {
  auth.signOut();
}

function submitScore() {
  const user = auth.currentUser;
  const year = document.getElementById("year").value;
  const subject = document.getElementById("subject").value;
  const score = parseInt(document.getElementById("score").value);

  if (!user || !year || !subject || isNaN(score)) return alert("Complete all fields");

  const path = `scores/${subject}/${user.uid}`;
  db.ref(path).push({ score, timestamp: Date.now(), year }).then(updateChart);
}

function updateChart() {
  const user = auth.currentUser;
  const subject = document.getElementById("subject").value;
  if (!user || !subject) return;

  const subjectRef = db.ref(`scores/${subject}`);

  subjectRef.once("value", snapshot => {
    const data = snapshot.val();
    const userScores = [];
    const averageScores = [];

    const timestamps = [];

    if (data) {
      let allScoresByTimestamp = {};
      for (let uid in data) {
        for (let key in data[uid]) {
          const entry = data[uid][key];
          if (!allScoresByTimestamp[entry.timestamp]) {
            allScoresByTimestamp[entry.timestamp] = [];
          }
          allScoresByTimestamp[entry.timestamp].push(entry.score);

          if (uid === user.uid) {
            userScores.push({ x: entry.timestamp, y: entry.score });
          }
        }
      }

      for (let ts in allScoresByTimestamp) {
        const scores = allScoresByTimestamp[ts];
        const avg = scores.reduce((a, b) => a + b) / scores.length;
        averageScores.push({ x: parseInt(ts), y: avg });
        timestamps.push(parseInt(ts));
      }

      // Sort by timestamp
      userScores.sort((a, b) => a.x - b.x);
      averageScores.sort((a, b) => a.x - b.x);
    }

    if (chart) chart.destroy();

    const ctx = document.getElementById("scoreChart").getContext("2d");
    chart = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [
          {
            label: "Your Scores",
            data: userScores,
            borderColor: "#00aaff",
            fill: false,
          },
          {
            label: "Class Average",
            data: averageScores,
            borderColor: "#ff6600",
            fill: false,
          }
        ]
      },
      options: {
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day"
            },
            title: {
              display: true,
              text: "Date"
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: "Score"
            }
          }
        }
      }
    });
  });
}

// Re-render chart when subject changes
document.getElementById("subject").addEventListener("change", updateChart);
