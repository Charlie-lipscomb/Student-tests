
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

let currentUserId = null;

auth.onAuthStateChanged(user => {
  if (user) {
    currentUserId = user.uid;
    loadAllGraphs();
  } else {
    auth.signInAnonymously().catch(console.error);
  }
});

document.getElementById('submitScore').addEventListener('click', () => {
  const year = document.getElementById('year').value;
  const subject = document.getElementById('subject').value;
  const score = parseInt(document.getElementById('score').value);

  if (!year || !subject || isNaN(score)) {
    alert("Please complete all fields.");
    return;
  }

  const timestamp = Date.now();
  const userRef = db.ref(`scores/${currentUserId}/${subject}/${timestamp}`);
  const allRef = db.ref(`allScores/${subject}/${timestamp}`);

  userRef.set({ score, year });
  allRef.set({ score });

  loadAllGraphs();
});

function loadAllGraphs() {
  const container = document.getElementById('chartsContainer');
  container.innerHTML = '';

  const subjects = [
    "Maths", "Biology", "Chemistry", "Physics", "English", "French", "German", "Italian",
    "Spanish", "Latin", "Greek", "Classical Civilisation", "Geography", "History", "Music",
    "Sport Science", "Computer Science", "TP", "Economics"
  ];

  subjects.forEach(subject => {
    Promise.all([
      db.ref(`scores/${currentUserId}/${subject}`).once('value'),
      db.ref(`allScores/${subject}`).once('value')
    ]).then(([userSnap, allSnap]) => {
      const userData = userSnap.val() || {};
      const allData = allSnap.val() || {};

      const userEntries = Object.entries(userData).sort(([a], [b]) => a - b);
      const allEntries = Object.entries(allData).sort(([a], [b]) => a - b);

      if (userEntries.length === 0) return;

      const labels = userEntries.map(([key]) => new Date(Number(key)).toLocaleDateString());
      const userScores = userEntries.map(([, val]) => val.score);

      const averageScores = userEntries.map(([key]) => {
        const timestamp = key;
        const allAtTime = Object.entries(allData).filter(([t]) => t === timestamp).map(([, v]) => v.score);
        const avg = allAtTime.length ? (allAtTime.reduce((a, b) => a + b, 0) / allAtTime.length) : null;
        return avg !== null ? avg : 0;
      });

      const canvas = document.createElement('canvas');
      container.appendChild(canvas);

      new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Your Scores',
              data: userScores,
              borderColor: '#007bff',
              backgroundColor: 'rgba(0,123,255,0.1)',
              fill: true,
              tension: 0.3
            },
            {
              label: 'Class Average',
              data: averageScores,
              borderColor: '#28a745',
              backgroundColor: 'rgba(40,167,69,0.1)',
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
    });
  });
}
