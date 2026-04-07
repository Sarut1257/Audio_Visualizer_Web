// G:\University_BUU\Project\Audio_Visualizer_Web\js\script.js
let audioCtx, analyser, source, dataArray, bufferLength;
let audio = new Audio(); // สร้าง Audio Object ส่วนกลาง

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

const controls = document.getElementById('player-controls');
const playPauseBtn = document.getElementById('playPauseBtn');
const seekBar = document.getElementById('seekBar');

// 1. ฟังก์ชันเริ่มระบบ Visualizer
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

// 2. ฟังก์ชันวาด (คงเดิมแต่ปรับสีธรรมชาติ)
function animate() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    analyser.getByteFrequencyData(dataArray);

    const barWidth = (canvas.width / bufferLength) * 1.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
        let barHeight = dataArray[i] * 2.5;
        const hue = 120 + (i * 0.5);
        ctx.fillStyle = `hsl(${hue}, 50%, 50%)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 2;
    }
    
    // อัปเดตแถบ Seek Bar ตามเวลาเพลง
    if (!audio.paused) {
        seekBar.value = (audio.currentTime / audio.duration) * 100;
    }
    requestAnimationFrame(animate);
}

// 3. Event: เมื่อเลือกไฟล์
document.getElementById('audioFile').onchange = function(e) {
    const file = e.target.files[0];
    if (file) {
        audio.src = URL.createObjectURL(file);
        document.getElementById('container').style.display = 'none'; // ซ่อนเมนูแรก
        controls.style.display = 'flex'; // โชว์ตัวควบคุม
        audio.play();
        initVisualizer();
    }
};

// 4. ปุ่ม Play/Pause
playPauseBtn.onclick = function() {
    if (audio.paused) {
        audio.play();
        this.innerText = "II"; // สัญลักษณ์ Pause
    } else {
        audio.pause();
        this.innerText = "▶"; // สัญลักษณ์ Play
    }
};

// 5. เลื่อนช่วงเวลาเพลง (Seek)
seekBar.oninput = function() {
    const seekTo = audio.duration * (this.value / 100);
    audio.currentTime = seekTo;
};