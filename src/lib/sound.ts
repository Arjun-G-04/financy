let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function getAudioContext(): AudioContext | null {
	if (typeof window === 'undefined' || !window.AudioContext) return null;

	if (!audioCtx) {
		audioCtx = new window.AudioContext();
	}

	return audioCtx;
}

/**
 * Pre-warms and resumes AudioContext on early user gesture so click transients are never clipped.
 */
export function warmAudioContext(): void {
	const ctx = getAudioContext();
	if (ctx && ctx.state === 'suspended') {
		void ctx.resume().catch(() => {});
	}
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
	if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) {
		return noiseBuffer;
	}

	// 25ms white noise buffer for mechanical switch contact transient
	const length = Math.floor(ctx.sampleRate * 0.025);
	const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < length; i++) {
		data[i] = Math.random() * 2 - 1;
	}
	noiseBuffer = buffer;
	return buffer;
}

export type ClickVariant = 'standard' | 'primary';

/**
 * Synthesizes a subtle tactile mechanical switch click via Web Audio API.
 */
export async function playMechanicalClick(variant: ClickVariant = 'standard'): Promise<void> {
	try {
		const ctx = getAudioContext();
		if (!ctx) return;

		if (ctx.state === 'suspended') {
			await ctx.resume();
		}

		const now = ctx.currentTime;
		const isPrimary = variant === 'primary';

		// 1. Keycap body thud (short pitch-drop triangle transient)
		const osc = ctx.createOscillator();
		const oscGain = ctx.createGain();
		osc.type = 'triangle';
		osc.frequency.setValueAtTime(isPrimary ? 340 : 280, now);
		osc.frequency.exponentialRampToValueAtTime(isPrimary ? 78 : 95, now + (isPrimary ? 0.028 : 0.02));

		oscGain.gain.setValueAtTime(isPrimary ? 0.16 : 0.11, now);
		oscGain.gain.exponentialRampToValueAtTime(0.001, now + (isPrimary ? 0.032 : 0.022));

		osc.connect(oscGain);
		oscGain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + 0.035);

		// 2. Micro-switch contact snap (bandpass-filtered noise burst)
		const noise = ctx.createBufferSource();
		noise.buffer = getNoiseBuffer(ctx);

		const filter = ctx.createBiquadFilter();
		filter.type = 'bandpass';
		filter.frequency.setValueAtTime(isPrimary ? 1900 : 2500, now);
		filter.Q.setValueAtTime(2.2, now);

		const noiseGain = ctx.createGain();
		noiseGain.gain.setValueAtTime(isPrimary ? 0.14 : 0.1, now);
		noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (isPrimary ? 0.018 : 0.014));

		noise.connect(filter);
		filter.connect(noiseGain);
		noiseGain.connect(ctx.destination);
		noise.start(now);
		noise.stop(now + 0.022);
	} catch {
		// Ignore audio errors if blocked by browser autoplay policy
	}
}
