let audioCtx, analyser, source, dataArray, timeDataArray, bufferLength;
let audio = new Audio();
let particles = [];
let mouse = { x: null, y: null };

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
const changeSongBtn = document.getElementById('changeSongBtn'); // ปุ่มเปลี่ยนเพลง

// --- 1. การจัดการไฟล์และการเปลี่ยนเพลง ---
function handleFileSelection(file) {
    if (file && file.type.startsWith('audio/')) {
        // อัปเดตชื่อเพลง
        const nameOnly = file.name.replace(/\.[^/.]+$/, "");
        if (fileNameSpan) fileNameSpan.innerText = nameOnly;
        if (songTitleDiv) songTitleDiv.style.display = 'block';

        // รีเซ็ตเพลงและเริ่มใหม่
        audio.pause();
        audio.src = URL.createObjectURL(file);
        
        document.getElementById('container').style.display = 'none';
        if (controls) controls.style.display = 'flex';
        
        initVisualizer().then(() => {
            audio.play();
            playPauseBtn.innerText = "II";
        });
    }
}

// คลิกปุ่มเปลี่ยนเพลง
if (changeSongBtn) {
    changeSongBtn.onclick = (e) => {
        e.preventDefault();
        audioFileInput.click(); // สั่งให้ input file เด้งขึ้นมา
    };
}

// เมื่อเลือกไฟล์ผ่านหน้าต่าง Windows
audioFileInput.onchange = (e) => handleFileSelection(e.target.files[0]);

// Drag & Drop
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
    e.preventDefault();
    handleFileSelection(e.dataTransfer.files[0]);
});

// --- 2. ระบบ Particles & Mouse Gravity ---
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 6;
        this.speedY = (Math.random() - 0.5) * 6;
        this.color = color;
        this.life = 100;
    }
    update() {
        if (mouse.x !== null) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 200) { 
                this.speedX += dx * 0.01; 
                this.speedY += dy * 0.01; 
            }
        }
        this.x += this.speedX; this.y += this.speedY;
        this.life -= 1.5;
        if (this.size > 0.1) this.size -= 0.05;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / 100;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// --- 3. ระบบ Visualizer & Animation ---
async function initVisualizer() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 256;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        timeDataArray = new Uint8Array(bufferLength);
        animate();
    }
    if (audioCtx.state === 'suspended') await audioCtx.resume();
}

function animate() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.fillStyle = 'rgba(253, 253, 253, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        analyser.getByteTimeDomainData(timeDataArray);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 150;

        particles.forEach((p, i) => {
            p.update(); p.draw();
            if (p.life <= 0) particles.splice(i, 1);
        });

        // Waveform Center
        ctx.lineWidth = 2; ctx.strokeStyle = '#1a531f';
        ctx.beginPath();
        let sliceWidth = (radius * 2) / bufferLength;
        let xWave = centerX - radius;
        for (let i = 0; i < bufferLength; i++) {
            let v = timeDataArray[i] / 128.0;
            let yWave = v * (radius / 2) + (centerY - radius / 4);
            if (i === 0) ctx.moveTo(xWave, yWave); else ctx.lineTo(xWave, yWave);
            xWave += sliceWidth;
        }
        ctx.stroke();

        // Circular Bars
        for (let i = 0; i < bufferLength; i++) {
            const angle = i * (Math.PI * 2) / bufferLength;
            const barHeight = dataArray[i] * 1.2;
            const xStart = centerX + Math.cos(angle) * radius;
            const yStart = centerY + Math.sin(angle) * radius;
            const xEnd = centerX + Math.cos(angle) * (radius + barHeight);
            const yEnd = centerY + Math.sin(angle) * (radius + barHeight);
            const color = `hsl(${120 + (i * 0.5)}, 50%, 50%)`;
            ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(xStart, yStart); ctx.lineTo(xEnd, yEnd); ctx.stroke();
            if (dataArray[i] > 210) for(let j=0; j<2; j++) particles.push(new Particle(xEnd, yEnd, color));
        }
    }
    if (!audio.paused) seekBar.value = (audio.currentTime / audio.duration) * 100 || 0;
    requestAnimationFrame(animate);
}

// Play/Pause & Seek
playPauseBtn.onclick = () => {
    initVisualizer().then(() => {
        if (audio.paused) { audio.play(); playPauseBtn.innerText = "II"; }
        else { audio.pause(); playPauseBtn.innerText = "▶"; }
    });
};
seekBar.oninput = () => { audio.currentTime = audio.duration * (seekBar.value / 100); };