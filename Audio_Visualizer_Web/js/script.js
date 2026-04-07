// G:\University_BUU\Project\Audio_Visualizer_Web\js\script.js
let audioCtx, analyser, source, dataArray, bufferLength;
const canvas = document.createElement('canvas');
// เพิ่ม class ให้ canvas เพื่อคุม z-index
canvas.className = 'visualizer-canvas'; 
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

function initVisualizer(audioElement) {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audioElement);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        
        analyser.fftSize = 256; // ความละเอียดของแท่งกราฟ
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        animate();
    }
}

function animate() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // เคลียร์ Canvas ให้สะอาด
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    analyser.getByteFrequencyData(dataArray);

    const barWidth = (canvas.width / bufferLength) * 1.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        let barHeight = dataArray[i] * 2.5;
        
        // --- ส่วนที่แก้เพื่อสีธรรมชาติ ---
        // ใช้ HSL เพื่อไล่เฉดสีเขียวธรรมชาติ
        // Hue: 90-150 คือช่วงสีเขียว
        // Saturation: 40-70% ไม่สดเกินไป
        // Lightness: 50% กำลังดี
        const hue = 120 + (i * 0.5); // เขียวใบไม้
        const saturation = 50 + (dataArray[i] / 5); // สีสดขึ้นตามความดัง
        const lightness = 60 - (i / 5); // สีเข้มขึ้นตามความถี่สูง

        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        
        // วาดแท่งกราฟโดยให้มีความโค้งเล็กน้อย ดูเป็นธรรมชาติ
        drawRoundedRect(ctx, x, canvas.height - barHeight, barWidth, barHeight, 5);

        x += barWidth + 2;
    }
    requestAnimationFrame(animate);
}

// ฟังก์ชันช่วยวาดสี่เหลี่ยมมุมโค้ง
function drawRoundedRect(ctx, x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    ctx.fill();
}

// ฟังก์ชันสำหรับ Handle ไฟล์เพลง
document.getElementById('audioFile').onchange = function(e) {
    const files = this.files;
    if (files.length > 0) {
        const audio = new Audio(URL.createObjectURL(files[0]));
        // ซ่อนเมนูเมื่อเล่น
        document.getElementById('container').style.display = 'none'; 
        audio.play();
        initVisualizer(audio);
    }
};