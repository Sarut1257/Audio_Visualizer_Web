let audioCtx, analyser, source, dataArray, bufferLength;
let audio = new Audio();

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

// ดึง Elements
const controls = document.getElementById('player-controls');
const playPauseBtn = document.getElementById('playPauseBtn');
const seekBar = document.getElementById('seekBar');
const songTitleDiv = document.getElementById('song-title');
const fileNameSpan = document.getElementById('file-name');
const audioFileInput = document.getElementById('audioFile');
const changeSongBtn = document.getElementById('changeSongBtn');

// --- ฟังก์ชันแสดงชื่อไฟล์ (หัวใจสำคัญที่หายไปเมื่อกี้) ---
function updateSongTitle(file) {
    if (file && fileNameSpan) {
        // ตัดนามสกุลไฟล์ออก (.mp3, .wav)
        const nameOnly = file.name.replace(/\.[^/.]+$/, "");
        fileNameSpan.innerText = nameOnly;
        if (songTitleDiv) songTitleDiv.style.display = 'block';
    }
}

// --- ฟังก์ชันหลักสำหรับเปลี่ยนเพลง ---
function handleFileSelection(file) {
    if (file) {
        updateSongTitle(file);
        audio.pause();
        audio.src = URL.createObjectURL(file);
        
        // ซ่อนหน้าแรก โชว์หน้าเล่นเพลง
        document.getElementById('container').style.display = 'none';
        controls.style.display = 'flex';
        
        audio.play();
        initVisualizer();
    }
}

// Event: เมื่อเลือกไฟล์ผ่านปุ่ม
audioFileInput.onchange = (e) => handleFileSelection(e.target.files[0]);

// Event: ปุ่มเปลี่ยนเพลง
if (changeSongBtn) {
    changeSongBtn.onclick = () => audioFileInput.click();
}

// Event: Drag & Drop
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
        handleFileSelection(file);
    }
});

// --- ระบบ Visualizer (Circular Mode) ---
function initVisualizer() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 256;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        animate();
    }
}

function animate() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Background จางๆ ให้เกิด Motion Blur
    ctx.fillStyle = 'rgba(253, 253, 253, 0.2)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    analyser.getByteFrequencyData(dataArray);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 150;

    for (let i = 0; i < bufferLength; i++) {
        const angle = i * (Math.PI * 2) / bufferLength;
        const barHeight = dataArray[i] * 1.2;

        const xStart = centerX + Math.cos(angle) * radius;
        const yStart = centerY + Math.sin(angle) * radius;
        const xEnd = centerX + Math.cos(angle) * (radius + barHeight);
        const yEnd = centerY + Math.sin(angle) * (radius + barHeight);

        const hue = 120 + (i * 0.5);
        ctx.strokeStyle = `hsl(${hue}, 50%, 50%)`;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();
    }

    if (!audio.paused) {
        seekBar.value = (audio.currentTime / audio.duration) * 100;
    }
    requestAnimationFrame(animate);
}

// ปุ่ม Play/Pause และ Seek
playPauseBtn.onclick = () => {
    if (audio.paused) {
        audio.play();
        playPauseBtn.innerText = "II";
    } else {
        audio.pause();
        playPauseBtn.innerText = "▶";
    }
};

seekBar.oninput = () => {
    audio.currentTime = audio.duration * (seekBar.value / 100);
};