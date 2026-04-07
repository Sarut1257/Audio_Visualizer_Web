
let audioCtx, analyser, source, dataArray, timeDataArray, bufferLength;
let audio = new Audio();
let particles = [];
let flashOpacity = 0; 

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
const volumeBar = document.getElementById('volumeBar');

function handleFileSelection(file) {
    if (file && file.type.startsWith('audio/')) {
        const nameOnly = file.name.replace(/\.[^/.]+$/, "");
        if (fileNameSpan) fileNameSpan.innerText = nameOnly;
        if (songTitleDiv) songTitleDiv.style.display = 'block';
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

if (changeSongBtn) {
    changeSongBtn.onclick = (e) => {
        e.preventDefault();
        audioFileInput.click();
    };
}

audioFileInput.onchange = (e) => handleFileSelection(e.target.files[0]);
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
    e.preventDefault();
    handleFileSelection(e.dataTransfer.files[0]);
});

// --- [แก้ไข] ตัด Event Listener mousemove ออกเพื่อให้โค้ดคลีนขึ้น ---

class Particle {
    constructor(x, y, color) {
        this.x = x; 
        this.y = y;
        this.size = Math.random() * 3 + 1;
        // ความเร็วสุ่มเพื่อให้กระจายตัวออกรอบทิศทางอย่างอิสระ
        this.speedX = (Math.random() - 0.5) * 6;
        this.speedY = (Math.random() - 0.5) * 6;
        this.color = color;
        this.life = 100;
    }
    update() {
        // [แก้ไข] ตัด Logic ตรวจสอบตำแหน่งเมาส์ออก ให้อนุภาควิ่งตามแรงส่งเดิม
        this.x += this.speedX; 
        this.y += this.speedY;
        this.life -= 1.5;
        if (this.size > 0.1) this.size -= 0.05;
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
    
    ctx.fillStyle = 'rgb(253, 253, 253)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        analyser.getByteTimeDomainData(timeDataArray);

        let bassSum = 0;
        for (let i = 0; i < 10; i++) bassSum += dataArray[i];
        let bassAverage = bassSum / 10;

        if (bassAverage > 210) { 
            flashOpacity = 0.15; 
        }

        if (flashOpacity > 0) {
            ctx.fillStyle = `rgba(80, 141, 78, ${flashOpacity})`; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            flashOpacity -= 0.01; 
        }

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 150;

        particles.forEach((p, i) => {
            p.update(); 
            p.draw();
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
            if (dataArray[i] > 220) for(let j=0; j<2; j++) particles.push(new Particle(xEnd, yEnd, color));
        }
    }
    if (!audio.paused) seekBar.value = (audio.currentTime / audio.duration) * 100 || 0;
    requestAnimationFrame(animate);
}

// Volume Control Logic
if (volumeBar) {
    volumeBar.oninput = function() {
        audio.volume = this.value / 100;
        const volIcon = document.querySelector('.volume-container span');
        if (volIcon) {
            if (this.value == 0) volIcon.innerText = "🔇";
            else if (this.value < 50) volIcon.innerText = "🔉";
            else volIcon.innerText = "🔊";
        }
    };
}

// Play/Pause & Seek Logic
playPauseBtn.onclick = () => {
    initVisualizer().then(() => {
        if (audio.paused) { audio.play(); playPauseBtn.innerText = "II"; }
        else { audio.pause(); playPauseBtn.innerText = "▶"; }
    });
};

seekBar.oninput = () => { 
    audio.currentTime = audio.duration * (seekBar.value / 100); 
};