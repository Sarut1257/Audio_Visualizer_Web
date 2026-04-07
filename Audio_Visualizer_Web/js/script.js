let audioCtx, analyser, source, dataArray, bufferLength;
let audio = new Audio();
let particles = [];
const maxParticles = 50; 
const burstThreshold = 200; 

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

const controls = document.getElementById('player-controls');
const playPauseBtn = document.getElementById('playPauseBtn');
const seekBar = document.getElementById('seekBar');
const songTitleDiv = document.getElementById('song-title');
const fileNameSpan = document.getElementById('file-name');
const audioFileInput = document.getElementById('audioFile');
const changeSongBtn = document.getElementById('changeSongBtn');

// --- ระบบ Particles ---
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 6;
        this.speedY = (Math.random() - 0.5) * 6;
        this.color = color;
        this.life = 100;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 2;
        if (this.size > 0.2) this.size -= 0.1;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / 100;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function createBurst(x, y, color) {
    for (let i = 0; i < 3; i++) {
        if (particles.length < maxParticles) {
            particles.push(new Particle(x, y, color));
        }
    }
}

// --- การจัดการไฟล์ ---
function handleFileSelection(file) {
    if (file) {
        const nameOnly = file.name.replace(/\.[^/.]+$/, "");
        if (fileNameSpan) fileNameSpan.innerText = nameOnly;
        if (songTitleDiv) songTitleDiv.style.display = 'block';

        audio.pause();
        audio.src = URL.createObjectURL(file);
        
        document.getElementById('container').style.display = 'none';
        if (controls) controls.style.display = 'flex';
        
        // บังคับเล่นเพลงและเริ่ม Visualizer
        audio.play().then(() => {
            initVisualizer();
        }).catch(err => console.log("รอ User Click ก่อนเล่นเพลง: ", err));
    }
}

// ผูก Event ให้ถูกต้อง (ตัวเดียวจบ)
audioFileInput.onchange = (e) => handleFileSelection(e.target.files[0]);
if (changeSongBtn) changeSongBtn.onclick = () => audioFileInput.click();

window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
    e.preventDefault();
    handleFileSelection(e.dataTransfer.files[0]);
});

// --- ระบบ Audio & Animation ---
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
    ctx.fillStyle = 'rgba(253, 253, 253, 0.3)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (analyser) {
        analyser.getByteFrequencyData(dataArray);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 150;

        particles.forEach((p, i) => {
            p.update(); p.draw();
            if (p.life <= 0) particles.splice(i, 1);
        });

        for (let i = 0; i < bufferLength; i++) {
            const angle = i * (Math.PI * 2) / bufferLength;
            const barHeight = dataArray[i] * 1.2;
            const xStart = centerX + Math.cos(angle) * radius;
            const yStart = centerY + Math.sin(angle) * radius;
            const xEnd = centerX + Math.cos(angle) * (radius + barHeight);
            const yEnd = centerY + Math.sin(angle) * (radius + barHeight);

            const color = `hsl(${120 + (i * 0.5)}, 50%, 50%)`;
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(xStart, yStart);
            ctx.lineTo(xEnd, yEnd);
            ctx.stroke();

            if (dataArray[i] > burstThreshold) createBurst(xEnd, yEnd, color);
        }
    }

    if (!audio.paused) {
        seekBar.value = (audio.currentTime / audio.duration) * 100 || 0;
    }
    requestAnimationFrame(animate);
}

// ปุ่มควบคุม
playPauseBtn.onclick = () => {
    if (audio.paused) { audio.play(); playPauseBtn.innerText = "II"; }
    else { audio.pause(); playPauseBtn.innerText = "▶"; }
};

seekBar.oninput = () => {
    audio.currentTime = audio.duration * (seekBar.value / 100);
};
