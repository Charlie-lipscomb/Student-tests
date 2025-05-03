let charts = {};

// Listen for auth state
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("app-section").style.display = "block";
    fetchAndDisplayScoresRealtime();
  } else {
    document.getElementById("auth-section").style.display = "block";
    document.getElementById("app-section").style.display = "none";
  }
});

function submitScore() {
  const user = auth.currentUser;
  const subject = document.getElementById("subject").value;
  const score = parseFloat(document.getElementById("score").value);

  if (!user || !subject || isNaN(score)) {
    alert("Please fill in all fields correctly.");
    return;
  }

  const timestamp = Date.now();

  const scoreData = {
    score,
    timestamp
  };

  const ref = firebase.database().ref(`scores/${user.uid}/${subject}`).push();
  ref.set(scoreData).then(() => {
    console.log("Score added to Realtime Database!");
    fetchAndDisplayScoresRealtime(); // Reload data
  }).catch(err => {
    console.error("Error writing to database:", err);
  });
}

function fetchAndDisplayScoresRealtime() {
  const user = auth.currentUser;
  if (!user) return;

  const subjects = ["Maths", "English", "Science"]; // Customize your subjects

  subjects.forEach(subject => {
    const userRef = firebase.database().ref(`scores/${user.uid}/${subject}`);
    const allRef = firebase.database().ref(`scores`);

    // Fetch user data
    userRef.once("value", snapshot => {
      const scores = [];
      const labels = [];

      snapshot.forEach(child => {
        const data = child.val();
        const date = new Date(data.timestamp).toLocaleDateString();
        scores.push(data.score);
        labels.push(date);
      });

      // Fetch global average for the subject
      allRef.once("value", allSnapshot => {
        let total = 0, count = 0;

        allSnapshot.forEach(userSnap => {
          const subjSnap = userSnap.child(subject);
          subjSnap.forEach(scoreSnap => {
            const s = scoreSnap.val().score;
            total += s;
            count++;
          });
        });

        const average = count > 0 ? (total / count).toFixed(2) : null;
        drawChart(subject, labels, scores, average);
      });
    });
  });
}

function drawChart(subject, labels, scores, average) {
  const ctx = document.getElementById(`${subject}Chart`).getContext("2d");

  if (charts[subject]) charts[subject].destroy();

  charts[subject] = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: `${subject} Scores`,
          data: scores,
          borderColor: "#2196f3",
          backgroundColor: "rgba(33, 150, 243, 0.2)",
          fill: true,
          tension: 0.3
        },
        {
          label: "Average Score",
          data: Array(scores.length).fill(parseFloat(average)),
          borderColor: "#4caf50",
          backgroundColor: "rgba(76, 175, 80, 0.2)",
          fill: true,
          tension: 0.3
        }
      ]
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
