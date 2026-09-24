/**
 * Voxa AI - Dynamic Sound Wave Canvas Visualizer
 * Renders smooth multi-layered sinusoidal sound waves for Idle, Listening, Processing, and Speaking states.
 * Integrates with Web Audio API AnalyserNode when microphone audio stream is active.
 */

class SoundWaveVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext("2d");
        this.state = "idle"; // 'idle' | 'listening' | 'processing' | 'speaking'
        this.phase = 0;
        this.animationId = null;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.source = null;

        this.initResize();
        this.start();
    }

    initResize() {
        const resize = () => {
            if (!this.canvas) return;
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = rect.width * (window.devicePixelRatio || 1);
            this.canvas.height = 120 * (window.devicePixelRatio || 1);
            this.canvas.style.width = `${rect.width}px`;
            this.canvas.style.height = `120px`;
        };
        window.addEventListener("resize", resize);
        resize();
    }

    setState(newState) {
        this.state = newState;
    }

    attachStream(stream) {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            this.audioContext = new AudioCtx();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 64;
            this.source = this.audioContext.createMediaStreamSource(stream);
            this.source.connect(this.analyser);
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        } catch (e) {
            console.warn("Could not attach real audio stream to visualizer:", e);
        }
    }

    detachStream() {
        if (this.audioContext && this.audioContext.state !== "closed") {
            try { this.audioContext.close(); } catch (e) {}
        }
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
    }

    start() {
        if (this.animationId) return;
        const render = () => {
            this.draw();
            this.animationId = requestAnimationFrame(render);
        };
        render();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    draw() {
        if (!this.canvas || !this.ctx) return;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerY = height / 2;

        this.ctx.clearRect(0, 0, width, height);

        let energy = 0.15;
        if (this.analyser && this.dataArray && this.state === "listening") {
            this.analyser.getByteFrequencyData(this.dataArray);
            let sum = 0;
            for (let i = 0; i < this.dataArray.length; i++) sum += this.dataArray[i];
            energy = Math.max(0.15, (sum / this.dataArray.length) / 128);
        }

        // State parameters
        let baseAmp = 6;
        let speed = 0.04;
        let layers = [
            { color: "rgba(108, 74, 182, 0.4)", freq: 0.012, ampMult: 1.0 },   // Deep Purple
            { color: "rgba(32, 196, 216, 0.7)", freq: 0.018, ampMult: 1.4 },   // Cyan Blue
            { color: "rgba(255, 159, 67, 0.6)", freq: 0.024, ampMult: 0.8 }    // Soft Orange
        ];

        if (this.state === "listening") {
            baseAmp = 28 * energy;
            speed = 0.09;
        } else if (this.state === "processing") {
            baseAmp = 14;
            speed = 0.15;
        } else if (this.state === "speaking") {
            baseAmp = 22 * (0.8 + Math.sin(this.phase * 2) * 0.3);
            speed = 0.07;
        } else {
            // Idle
            baseAmp = 4;
            speed = 0.025;
        }

        this.phase += speed;

        // Draw sinusoidal waves
        layers.forEach((layer, idx) => {
            this.ctx.beginPath();
            this.ctx.lineWidth = idx === 1 ? 3 : 2;
            this.ctx.strokeStyle = layer.color;

            for (let x = 0; x < width; x += 3) {
                // Taper wave at edges for smooth blend
                const envelope = Math.sin((x / width) * Math.PI);
                const y = centerY + Math.sin(x * layer.freq + this.phase + idx * 1.8) * baseAmp * layer.ampMult * envelope;
                if (x === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
        });

        // Center glow effect
        if (this.state === "listening" || this.state === "speaking") {
            const glowGrad = this.ctx.createRadialGradient(width / 2, centerY, 0, width / 2, centerY, width / 3);
            glowGrad.addColorStop(0, "rgba(32, 196, 216, 0.12)");
            glowGrad.addColorStop(1, "transparent");
            this.ctx.fillStyle = glowGrad;
            this.ctx.fillRect(0, 0, width, height);
        }
    }
}

window.SoundWaveVisualizer = SoundWaveVisualizer;
