
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

function signUp() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, pass)
    .then(() => {
      document.getElementById("auth-container").style.display = "none";
      document.getElementById("dashboard").style.display = "block";
      loadGraphs();
    })
    .catch((e) => alert(e.message));
}

function signIn() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      document.getElementById("auth-container").style.display = "none";
      document.getElementById("dashboard").style.display = "block";
      loadGraphs();
    })
    .catch((e) => alert(e.message));
}

function submitScore() {
  const year = document.getElementById("year").value;
  const subject = document.getElementById("subject").value;
  const score = parseFloat(document.getElementById("score").value);

  if (!year || !subject || isNaN(score)) return alert("Fill all fields!");

  const uid = auth.currentUser.uid;
  const newResultKey = db.ref().child("results").push().key;

  db.ref("users/" + uid + "/results/" + newResultKey).set({
    year,
    subject,
    score,
    timestamp: Date.now()
  }).then(() => {
    loadGraphs();
  });
}

function loadGraphs() {
  const uid = auth.currentUser.uid;
  db.ref("users/" + uid + "/results").once("value", (snapshot) => {
    const data = snapshot.val();
    const grouped = {};

    for (let id in data) {
      const { year, subject, score } = data[id];
      const key = year + " - " + subject;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({ score, timestamp: data[id].timestamp });
    }

    const chartsDiv = document.getElementById("charts");
    chartsDiv.innerHTML = "";

    Object.keys(grouped).forEach((key) => {
      const [year, subject] = key.split(" - ");
      const scores = grouped[key].sort((a, b) => a.timestamp - b.timestamp).map(e => e.score);
      const labels = scores.map((_, i) => `Test ${i + 1}`);

      // Average across all users for this subject + year
      db.ref("users").once("value", (usersSnap) => {
        let allScores = [];
        usersSnap.forEach((userSnap) => {
          const userData = userSnap.val();
          if (userData.results) {
            Object.values(userData.results).forEach((test) => {
              if (test.subject === subject && test.year === year) {
                allScores.push(parseFloat(test.score));
              }
            });
          }
        });

        const average = allScores.length > 0
          ? allScores.reduce((a, b) => a + b, 0) / allScores.length
          : 0;

        const averageLine = Array(scores.length).fill(average);

        const canvas = document.createElement("canvas");
        chartsDiv.appendChild(canvas);
        new Chart(canvas.getContext("2d"), {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: key + " - Your Scores",
                data: scores,
                borderColor: "blue",
                fill: false
              },
              {
                label: "Average",
                data: averageLine,
                borderColor: "red",
                borderDash: [5, 5],
                fill: false
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            height: 300
          }
        });
      });
    });
  });
}
