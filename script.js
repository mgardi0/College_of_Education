// 1. Firebase Configuration (پێویستە ئەم بەشە لە سایتەکەی خۆتەوە پڕ بکەیتەوە)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. Data & Variables
const questions = [
    { text: "ڤایرۆسەکان وەک زیندەوەرێکی تەواو پۆلێن دەکرێن چونکە دەتوانن بەبێ خانەی خانەخوێ (Host) گەشە بکەن.", answer: false },
    { text: "ئەڵماس و گرافیت هەردووکیان لە گەردیلەی کاربۆن پێکدێن، بۆیە گرافیت ڕەقترین ماددەیە لە سروشتدا.", answer: false },
    { text: "دەنگ لە بۆشاییدا (Space) خێراتر دەڕوات وەک لەوەی لە ناو ئاودا بڕوات.", answer: false },
    { text: "هەر ژمارەیەک (جگە لە سفر) ئەگەر توانەکەی (Exponent) ببێتە سفر، ئەوا ئەنجامەکەی یەکسانە بە سفر.", answer: false },
    { text: "بیردۆزی 'مەرجداربوونی کلاسیکی' (Classical Conditioning) کە تاقیکردنەوەی لەسەر سەگ کرد، لەلایەن زانا بی ئێف سکینەر پەرەی پێدراوە.", answer: false },
    { text: "ئۆتیزم (Autism) جۆرە نەخۆشییەکی دەروونی کاتییە و دەتوانرێت بە بەکارهێنانی دەرمانی پزیشکی بە تەواوی بنبڕ بکرێت.", answer: false },
    { text: "The word 'Information' is a countable noun, so we can say 'I have many informations'.", answer: false },
    { text: "کاتێک وشەی (لم) دەچێتە سەر کرداری داهاتوو (الفعل المضارع)، نیشانەی کۆتاییەکەی دەگۆڕێت بۆ (الفتحة).", answer: false },
    { text: "شاعیری ناودار 'هێمن موکریانی' نووسەری شاکارە شیعری 'مەم و زین'ـە.", answer: false },
    { text: "پیتی (ܐ - ئالەف) لە زمانی سریانیدا، تەنها لە کۆتایی وشەدا دەنووسرێت و لە سەرەتای وشەدا نایەت.", answer: false }
];

let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 8;
let userInfo = {};

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const countdownScreen = document.getElementById('countdown-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const questionText = document.getElementById('question-text');
const currentQSpan = document.getElementById('current-q');
const timeLeftBar = document.getElementById('time-left');

// 3. Start Process
document.getElementById('user-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Check local storage to prevent duplicate entry
    if (localStorage.getItem('hasTakenQuiz') === 'true') {
        alert("ببورە، تۆ تەنها یەکجار مافی بەشداریکردنت هەیە.");
        return;
    }

    userInfo.name = document.getElementById('username').value;
    userInfo.department = document.getElementById('department').value;
    
    welcomeScreen.classList.remove('active');
    startCountdown();
});

function startCountdown() {
    countdownScreen.classList.add('active');
    let count = 3;
    const countDisplay = document.getElementById('countdown-number');
    
    const countInterval = setInterval(() => {
        count--;
        countDisplay.innerText = count;
        if (count <= 0) {
            clearInterval(countInterval);
            countdownScreen.classList.remove('active');
            startQuiz();
        }
    }, 1000);
}

// 4. Quiz Logic
function startQuiz() {
    quizScreen.classList.add('active');
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        endQuiz();
        return;
    }

    const q = questions[currentQuestionIndex];
    questionText.innerText = q.text;
    currentQSpan.innerText = currentQuestionIndex + 1;
    
    resetTimer();
}

function resetTimer() {
    timeLeft = 8;
    updateTimerUI();
    clearInterval(timer);
    
    timer = setInterval(() => {
        timeLeft--;
        updateTimerUI();
        if (timeLeft <= 0) {
            clearInterval(timer);
            // Time out means wrong or no answer, move next with no points
            currentQuestionIndex++;
            loadQuestion();
        }
    }, 1000);
}

function updateTimerUI() {
    const percentage = (timeLeft / 8) * 100;
    timeLeftBar.style.width = percentage + "%";
}

function checkAnswer(userChoice) {
    clearInterval(timer);
    const correctAns = questions[currentQuestionIndex].answer; // Always false
    
    if (userChoice === correctAns) {
        score++;
    }
    
    currentQuestionIndex++;
    loadQuestion();
}

// 5. End & Save
function endQuiz() {
    quizScreen.classList.remove('active');
    resultScreen.classList.add('active');
    document.getElementById('final-score').innerText = score;

    // Save to LocalStorage
    localStorage.setItem('hasTakenQuiz', 'true');

    // Save to Firebase
    db.collection("results").add({
        name: userInfo.name,
        department: userInfo.department,
        score: score,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log("Score saved!");
    })
    .catch((error) => {
        console.error("Error saving score: ", error);
    });
}

// 6. Leaderboard (Admin view)
function showLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    document.getElementById('leaderboard').style.display = 'block';
    list.innerHTML = '<li>جار دەکرێت...</li>';

    db.collection("results").orderBy("score", "desc").limit(20).get().then((querySnapshot) => {
        list.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            list.innerHTML += `<li>${data.name} (${data.department}) - <strong>${data.score}</strong></li>`;
        });
    });
}
