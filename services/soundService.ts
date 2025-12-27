// Motor de Áudio Processual para o Oráculo 7
// Atualizado: SFX Harmônicos + Drone Binaural

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private ttsSource: AudioBufferSourceNode | null = null; 
  private ambientOscillators: OscillatorNode[] = [];
  private ambientGain: GainNode | null = null;
  
  private isMuted: boolean = false;
  private isAmbientActive: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    this.isMuted = localStorage.getItem('oraculo7_muted') === 'true';
    this.isAmbientActive = localStorage.getItem('oraculo7_ambient') === 'true';
  }

  public init() {
    if (this.isInitialized) return;
    
    try {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterGain = this.ctx.createGain();
      // Reduced master volume to prevent stridency
      this.masterGain.gain.value = this.isMuted ? 0 : 0.4;
      this.masterGain.connect(this.ctx.destination);

      this.setupReverb();
      
      // Start ambient if it was active
      if (this.isAmbientActive && !this.isMuted) {
          this.startAmbient();
      }

      this.isInitialized = true;
    } catch (e) {
      console.warn("Audio Context not supported");
    }
  }

  private setupReverb() {
    if (!this.ctx) return;
    // Creates a "Darker" reverb impulse to avoid metallic high-end
    const duration = 3.5;
    const decay = 3.0;
    const rate = this.ctx.sampleRate;
    const length = rate * duration;
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = i / length;
        // Exponential decay for smoother tail
        const vol = Math.pow(1 - n, decay); 
        left[i] = (Math.random() * 2 - 1) * vol;
        right[i] = (Math.random() * 2 - 1) * vol;
    }

    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = impulse;
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('oraculo7_muted', String(this.isMuted));
    
    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.4, t + 0.5);
    }
    
    if (this.isMuted) {
        this.stopAmbient(true); // Stop but keep state
    } else if (this.isAmbientActive) {
        this.startAmbient();
    }
  }

  public toggleAmbient() {
      this.isAmbientActive = !this.isAmbientActive;
      localStorage.setItem('oraculo7_ambient', String(this.isAmbientActive));
      
      if (this.isAmbientActive && !this.isMuted) {
          this.startAmbient();
      } else {
          this.stopAmbient();
      }
      return this.isAmbientActive;
  }

  public getMuteState() {
    return this.isMuted;
  }
  
  public getAmbientState() {
      return this.isAmbientActive;
  }

  // --- AMBIENT DRONE ENGINE ---
  private startAmbient() {
      if (!this.ctx || this.ambientOscillators.length > 0) return;
      
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0;
      this.ambientGain.connect(this.masterGain!);

      // Binaural Beat Setup (Theta ~4Hz difference)
      // Base: 110Hz (A2) - Deep grounding
      const freqs = [108, 112]; 
      
      freqs.forEach(f => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = f;
          osc.connect(this.ambientGain!);
          osc.start();
          this.ambientOscillators.push(osc);
      });

      // Fade in
      const t = this.ctx.currentTime;
      this.ambientGain.gain.linearRampToValueAtTime(0.08, t + 3); // Subtle volume
  }

  private stopAmbient(temporary = false) {
      if (!this.ctx || !this.ambientGain) return;
      
      const t = this.ctx.currentTime;
      this.ambientGain.gain.cancelScheduledValues(t);
      this.ambientGain.gain.linearRampToValueAtTime(0, t + 1);

      setTimeout(() => {
          this.ambientOscillators.forEach(o => o.stop());
          this.ambientOscillators = [];
          this.ambientGain = null;
      }, 1000);
      
      if (!temporary) {
          // Logic handled by flag isAmbientActive
      }
  }

  public stopTTS() {
    if (this.ttsSource) {
        try {
            this.ttsSource.stop();
        } catch (e) {}
        this.ttsSource = null;
    }
  }

  public async playTTS(base64Audio: string, onEnded?: () => void) {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    this.stopTTS();

    try {
        const audioBuffer = await this.decodePCM(base64Audio);
        const source = this.ctx.createBufferSource();
        source.buffer = audioBuffer;
        
        const dryGain = this.ctx.createGain();
        dryGain.gain.value = 0.9;
        
        const reverbGain = this.ctx.createGain();
        reverbGain.gain.value = 0.15; // Light ambiance for voice

        source.connect(dryGain);
        dryGain.connect(this.masterGain!);

        if (this.reverbNode) {
            source.connect(reverbGain);
            reverbGain.connect(this.reverbNode);
            this.reverbNode.connect(this.masterGain!);
        }

        source.onended = () => {
            this.ttsSource = null;
            if (onEnded) onEnded();
        };

        source.start();
        this.ttsSource = source;

    } catch (error) {
        console.error("Error playing TTS:", error);
        if (onEnded) onEnded();
    }
  }

  private async decodePCM(base64: string): Promise<AudioBuffer> {
     if (!this.ctx) throw new Error("No AudioContext");

     const binaryString = atob(base64);
     const len = binaryString.length;
     const buffer = new ArrayBuffer(len);
     const view = new Uint8Array(buffer);
     for (let i = 0; i < len; i++) {
        view[i] = binaryString.charCodeAt(i);
     }
     
     const dataInt16 = new Int16Array(buffer);
     const numChannels = 1; 
     const sampleRate = 24000;
     const frameCount = dataInt16.length / numChannels;
     
     const audioBuffer = this.ctx.createBuffer(numChannels, frameCount, sampleRate);
     
     for (let channel = 0; channel < numChannels; channel++) {
         const channelData = audioBuffer.getChannelData(channel);
         for (let i = 0; i < frameCount; i++) {
             channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
         }
     }
     return audioBuffer;
  }

  // --- HARMONIC SFX (Low Octave A Minor/C Major) ---
  // Strategy: Use Sine waves, lower octaves (Octave 3 and 4), and slower attack times.

  // Hover: A gentle "water drop" or "bubble" sound
  public playHover() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine'; 
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.linearRampToValueAtTime(175, t + 0.3);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.04, t + 0.15); 
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5); 
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    if (this.reverbNode) {
        const reverbSend = this.ctx.createGain();
        reverbSend.gain.value = 0.35; 
        osc.connect(reverbSend);
        reverbSend.connect(this.reverbNode);
        this.reverbNode.connect(this.masterGain);
    }

    osc.start(t);
    osc.stop(t + 0.6);
  }

  // Click: A soft "wood block" or "heartbeat" thud
  public playClick() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t); // A2 (Very low/warm)
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.1); 
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.02); 
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15); 
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Transition: "Water Harp" - Gentle arpeggio
  public playTransition() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 440.00];
    
    notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        const delay = i * 0.12; 
        
        gain.gain.setValueAtTime(0, t + delay);
        gain.gain.linearRampToValueAtTime(0.03, t + delay + 0.2); 
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 2.0); 
        
        osc.connect(gain);
        gain.connect(this.masterGain!);

        if (this.reverbNode) {
            const reverbSend = this.ctx.createGain();
            reverbSend.gain.value = 0.5;
            osc.connect(reverbSend);
            reverbSend.connect(this.reverbNode);
            this.reverbNode.connect(this.masterGain!);
        }

        osc.start(t + delay);
        osc.stop(t + delay + 2.1);
    });
  }

  // Reveal: A warm "Pad" swell
  public playReveal() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const frequencies = [110, 164.8, 261.6, 329.6]; 
    
    frequencies.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(freq, t);
        
        const delay = i * 0.05; 
        const duration = 3.5;
        
        gain.gain.setValueAtTime(0, t + delay);
        gain.gain.linearRampToValueAtTime(0.05, t + delay + 0.8); 
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + duration); 
        
        osc.connect(gain);
        gain.connect(this.masterGain!);

         if (this.reverbNode) {
            const reverbSend = this.ctx.createGain();
            reverbSend.gain.value = 0.6; 
            osc.connect(reverbSend);
            reverbSend.connect(this.reverbNode);
            this.reverbNode.connect(this.masterGain!);
        }

        osc.start(t + delay);
        osc.stop(t + delay + duration + 0.5);
    });
  }
}

export const soundManager = new SoundManager();