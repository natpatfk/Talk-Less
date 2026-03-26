// =========================================================
// นำเข้า Library ตัวใหม่ล่าสุด (ES Modules)
// =========================================================
import { GestureRecognizer, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

// ==========================================
// 1. ระบบเปลี่ยนหน้าเว็บ (Navigation)
// ==========================================
window.navTo = function(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.getElementById(pageId).classList.add('active-page');
    
    if(pageId === 'page-3') { startCamera('video-practice'); updatePracticeUI(); }
    else if(pageId === 'page-4') { startCamera('video-test'); }
    else { stopCamera(); } 
}

window.showLevelSelect = function() {
    const levelDiv = document.getElementById('level-select');
    levelDiv.style.display = levelDiv.style.display === 'block' ? 'none' : 'block';
}

// ==========================================
// 2. ระบบ AI ทายภาษามือ (MediaPipe)
// ==========================================
let gestureRecognizer;
let currentStream = null;
let webcamRunning = false;
let lastVideoTime = -1;

async function loadAIModel() {
    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "assets/gesture_recognizer.task", // ต้องมีไฟล์นี้ในโฟลเดอร์ assets
                delegate: "CPU"
            },
            runningMode: "VIDEO",
            numHands: 1
        });
        console.log("✅ AI โหลดสำเร็จพร้อมใช้งาน!");
        updateStatusText("✅ AI พร้อม! ชูมือได้เลย");
    } catch (error) {
        console.error("❌ โหลดไฟล์ .task ไม่สำเร็จ:", error);
        updateStatusText("❌ หาไฟล์ .task ไม่เจอ");
    }
}
loadAIModel();

function updateStatusText(text) {
    const elem1 = document.getElementById('guessed-word');
    const elem2 = document.getElementById('guessed-word-test');
    if(elem1) elem1.innerText = text;
    if(elem2) elem2.innerText = text;
}

// ==========================================
// 3. ระบบกล้อง (Camera)
// ==========================================
async function startCamera(videoId) {
    const vid = document.getElementById(videoId);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            stopCamera(); 
            currentStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            vid.srcObject = currentStream;
            
            vid.onloadedmetadata = () => {
                vid.play();
                webcamRunning = true;
                const canvas = document.getElementById(videoId.replace('video', 'canvas'));
                const ctx = canvas.getContext('2d');
                predictWebcam(vid, canvas, ctx);
            };
        } catch (err) {
            console.error("Camera error: ", err);
            alert("กรุณาอนุญาตให้ใช้กล้องเว็บแคมครับ");
        }
    }
}

function stopCamera() {
    webcamRunning = false;
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
}

// ==========================================
// 4. วงลูปจับภาพและทำนายผล
// ==========================================
async function predictWebcam(vidElement, canElement, canCtx) {
    if (!gestureRecognizer) {
        window.requestAnimationFrame(() => predictWebcam(vidElement, canElement, canCtx));
        return;
    }

    canElement.width = vidElement.videoWidth;
    canElement.height = vidElement.videoHeight;
    let startTimeMs = performance.now();
    
    if (vidElement.currentTime !== lastVideoTime) {
        lastVideoTime = vidElement.currentTime;
        
        // 🔮 ให้ AI วิเคราะห์ภาพ
        const results = gestureRecognizer.recognizeForVideo(vidElement, startTimeMs);

        canCtx.save();
        canCtx.clearRect(0, 0, canElement.width, canElement.height);

        canCtx.translate(canElement.width, 0);
        canCtx.scale(-1, 1);
        
        // วาดกระดูกสีแดง
        const drawingUtils = new DrawingUtils(canCtx);
        if (results.landmarks && results.landmarks.length > 0) {
            for (const landmarks of results.landmarks) {
                drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, { color: "#FFFFFF", lineWidth: 2 });
                drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 1, radius: 3 });
            }
        }

        // ทายผลตัวอักษร
        if (results.gestures && results.gestures.length > 0) {
            const categoryName = results.gestures[0][0].categoryName;
const score = Math.round(results.gestures[0][0].score * 100);

// เช็คว่าอยู่หน้าไหน
const isTestPage = document.getElementById('page-4').classList.contains('active-page');
const isPracticePage = document.getElementById('page-3').classList.contains('active-page');

const targetElem = isTestPage 
    ? document.getElementById('guessed-word-test') 
    : document.getElementById('guessed-word');

if (targetElem) {
    if(categoryName === "None" || categoryName === "none" || score < 30) {
        targetElem.innerText = "?";
        correctHoldFrames = 0;
    } else {
        targetElem.innerText = categoryName + ` (${score}%)`;

        // ==========================================
        // ⭐ PRACTICE MODE (NEW)
        // ==========================================
        if (isPracticePage) {
            const targetLetter = practiceData[pIndex].letter;

            if (
                categoryName.toUpperCase() === targetLetter.toUpperCase() &&
                score >= 90
            ) {
                correctHoldFrames++;

                if (correctHoldFrames > REQUIRED_FRAMES) {
                    correctHoldFrames = 0;
                    nextWord();
                }
            } else {
                correctHoldFrames = 0;
            }
        }

        // ==========================================
        // 🎯 TEST MODE 
        // ==========================================
        if(isTestPage) {
            if (currentSequence.length > 0 && currentLetterIndex < currentSequence.length) {
                const targetLetter = currentSequence[currentLetterIndex];
                if(categoryName.toUpperCase() === targetLetter.toUpperCase()) {
                    window.handleLetterResult(true);
                }
            }
        }
    }
}
        } else {
            const isTestPage = document.getElementById('page-4').classList.contains('active-page');
            const targetElem = isTestPage ? document.getElementById('guessed-word-test') : document.getElementById('guessed-word');
            if(targetElem && !targetElem.innerText.includes("AI")) {
                targetElem.innerText = "?";
            }
        }
        canCtx.restore();
    }

    if (webcamRunning === true) {
        window.requestAnimationFrame(() => predictWebcam(vidElement, canElement, canCtx));
    }
}

// ==========================================
// 5. โหมดฝึกซ้อม (Practice Mode)
// ==========================================
const practiceData = [
    { letter: "A", img: "assets/A_test.jpg" },
    { letter: "B", img: "assets/B_test.jpg" },
    { letter: "C", img: "assets/C_test.jpg" },
    { letter: "D", img: "assets/D_test.jpg" },
    { letter: "E", img: "assets/E_test.jpg" },
    { letter: "F", img: "assets/F_test.jpg" },
    { letter: "G", img: "assets/G_test.jpg" },
    { letter: "H", img: "assets/H_test.jpg" },
    { letter: "I", img: "assets/I_test.jpg" },
    { letter: "J", img: "assets/J_test.jpg" },
    { letter: "K", img: "assets/K_test.jpg" },
    { letter: "L", img: "assets/L_test.jpg" },
    { letter: "M", img: "assets/M_test.jpg" },
    { letter: "N", img: "assets/N_test.jpg" },
    { letter: "O", img: "assets/O_test.jpg" },
    { letter: "P", img: "assets/P_test.jpg" },
    { letter: "Q", img: "assets/Q_test.jpg" },
    { letter: "R", img: "assets/R_test.jpg" },
    { letter: "S", img: "assets/S_test.jpg" },
    { letter: "T", img: "assets/T_test.jpg" },
    { letter: "U", img: "assets/U_test.jpg" },
    { letter: "V", img: "assets/V_test.jpg" },
    { letter: "W", img: "assets/W_test.jpg" },
    { letter: "X", img: "assets/X_test.jpg" },
    { letter: "Y", img: "assets/Y_test.jpg" },
    { letter: "Z", img: "assets/Z_test.jpg" }
];
let pIndex = 0;

// ==========================================
// Practice Detection Logic 
// ==========================================
let correctHoldFrames = 0;
const REQUIRED_FRAMES = 15; // ~0.5 sec stability

window.updatePracticeUI = function() {
    const imgElement = document.getElementById('practice-img');
    imgElement.src = practiceData[pIndex].img;
    imgElement.onerror = function() {
        this.src = `https://via.placeholder.com/400x300?text=Sign+${practiceData[pIndex].letter}`;
    };
    document.getElementById('practice-word').innerText = practiceData[pIndex].letter;
}
window.nextWord = function() { pIndex = (pIndex + 1) % practiceData.length; window.updatePracticeUI(); }
window.prevWord = function() { pIndex = (pIndex - 1 + practiceData.length) % practiceData.length; window.updatePracticeUI(); }

// 6. โหมดทดสอบ (Test Mode)
// ==========================================
const testLevels = {
    easy: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
    medium: ["HELLO", "CAT", "DOG", "LOVE", "FOOD", "MUSIC", "HAPPY", "SAD", "WORK", "PLAY", "READ", "WRITE", "SLEEP", "DRINK", "WALK", "RUN", "JUMP", "SWIM", "DANCE", "SING"],
    hard: ["I AM OK", "WHAT IS YOUR NAME", "HOW ARE YOU", "THANK YOU", "SEE YOU LATER", "HAVE A NICE DAY", "I LOVE YOU", "GOOD MORNING", "GOOD NIGHT", "HAPPY BIRTHDAY", "CONGRATULATIONS", "MERRY CHRISTMAS", "HAPPY NEW YEAR", "I MISS YOU", "TAKE CARE", "BE SAFE", "STAY STRONG", "NEVER GIVE UP", "DREAM BIG", "WORK HARD"]
};

let currentSequence = [];
let currentLetterIndex = 0;
let correctCount = 0;
let timerInterval;
let timeLeft = 20;
let currentLevel = null;

window.startTest = function(level) {
    currentLevel = level;

    document.getElementById('test-level-title').innerText = "Test Level: " + level.toUpperCase();
    const randomQuestion = testLevels[level][Math.floor(Math.random() * testLevels[level].length)];
    currentSequence = randomQuestion.split('');
    currentLetterIndex = 0;
    correctCount = 0;
    
    window.navTo('page-4');
    renderTestSequence();
    startTimer();
}

function renderTestSequence() {
    const container = document.getElementById('test-sequence');
    container.innerHTML = '';
    currentSequence.forEach((char, index) => {
        let span = document.createElement('span');
        if (char === ' ') {
            span.innerHTML = "&nbsp;&nbsp;";
            container.appendChild(span);
            return;
        }
        span.innerText = char;
        span.id = 'letter-' + index;
        
        if (index < currentLetterIndex) span.className = 'word-target word-green';
        else if (index === currentLetterIndex) span.className = 'word-target word-active';
        else span.className = 'word-target';
        
        container.appendChild(span);
    });
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 20;
    document.getElementById('timer-display').innerText = timeLeft;
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-display').innerText = timeLeft;
        if (timeLeft <= 0) window.handleLetterResult(false);
    }, 1000);
}

window.handleLetterResult = function(isCorrect) {
    clearInterval(timerInterval);
    if (currentSequence[currentLetterIndex] === ' ') {
        currentLetterIndex++;
        if (currentLetterIndex >= currentSequence.length) { finishTest(); return; }
    }

    const letterElement = document.getElementById('letter-' + currentLetterIndex);
    if (isCorrect) { letterElement.className = 'word-target word-green'; correctCount++; } 
    else { letterElement.className = 'word-target word-red'; }

    currentLetterIndex++;
    if (currentLetterIndex < currentSequence.length && currentSequence[currentLetterIndex] === ' ') currentLetterIndex++;

    if (currentLetterIndex >= currentSequence.length) { setTimeout(finishTest, 1000); } 
    else { renderTestSequence(); startTimer(); }
}

window.continueTest = function() {
    document.getElementById('results-modal').style.display = 'none';

    // restart same level
    if (currentLevel) {
        startTest(currentLevel);
    }
}

function finishTest() {
    clearInterval(timerInterval);

    const totalLetters = currentSequence.filter(char => char !== ' ').length;
    let score = Math.round((correctCount / totalLetters) * 100);

    document.getElementById('final-score').innerText = score + "%";
    document.getElementById('results-modal').style.display = 'flex';

}

window.endTest = function() { clearInterval(timerInterval); window.navTo('page-2'); }
window.simulateBackendMatch = function() { window.handleLetterResult(true); }