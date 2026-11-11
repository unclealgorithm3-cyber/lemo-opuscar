import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 48000
DURATION = 30.0
N = int(SR * DURATION)
rng = np.random.default_rng(20261112)

def add_stereo(dst, mono, start, gain=1.0, pan=0.0):
    pan = float(np.clip(pan, -1, 1))
    start_i = max(0, int(round(start * SR)))
    if start_i >= len(dst):
        return

    mono = np.asarray(mono, dtype=np.float32)
    if mono.ndim != 1:
        mono = mono.reshape(-1)

    count = min(len(mono), len(dst) - start_i)
    if count <= 0:
        return

    left = np.sqrt(1 - pan)
    right = np.sqrt(1 + pan)

    dst[start_i:start_i + count, 0] += mono[:count] * gain * left
    dst[start_i:start_i + count, 1] += mono[:count] * gain * right

def midi_freq(note):
    return 440.0 * 2.0 ** ((note - 69) / 12.0)

def add_note(dst, note, start, duration, gain, pad=False):
    count = int(duration * SR)
    if count <= 0:
        return

    q = np.arange(count, dtype=np.float32) / SR
    f = midi_freq(note)

    if pad:
        env = np.minimum(1, q / 0.35)
        env *= np.minimum(1, (duration - q) / 0.55)
        wave = (
            np.sin(2 * np.pi * f * q)
            + 0.16 * np.sin(4 * np.pi * f * q)
        )
        wave *= env
    else:
        env = np.minimum(1, q / 0.012)
        env *= np.exp(-q * 4.0)
        wave = (
            np.sin(2 * np.pi * f * q)
            + 0.22 * np.sin(4 * np.pi * f * q)
            + 0.07 * np.sin(6 * np.pi * f * q)
        )
        wave *= env

    add_stereo(dst, wave, start, gain)

def add_sweep(dst, start, duration, f0, f1, gain):
    count = int(duration * SR)
    if count <= 0:
        return

    q = np.arange(count, dtype=np.float32) / SR
    phase = 2 * np.pi * (
        f0 * q + 0.5 * (f1 - f0) * q * q / duration
    )
    env = np.sin(np.pi * np.clip(q / duration, 0, 1)) ** 2
    wave = np.sin(phase) * env
    add_stereo(dst, wave, start, gain)

def make_music():
    music = np.zeros((N, 2), dtype=np.float32)

    # Original light, playful four-chord progression.
    chords = [
        [60, 64, 67],  # C
        [55, 59, 62],  # G
        [57, 60, 64],  # Am
        [53, 57, 60],  # F
        [60, 64, 67],
        [55, 59, 62],
        [57, 60, 64],
        [60, 64, 67],
    ]

    chord_duration = 3.75
    for i, chord in enumerate(chords):
        start = i * chord_duration
        dur = min(chord_duration, DURATION - start)
        for note in chord:
            add_note(music, note, start, dur, 0.027, pad=True)

    # Playful plucked melody.
    melody = [
        72, 76, 79, 84, 79, 76, 74, 76,
        72, 76, 81, 84, 81, 79, 76, 74,
        72, 74, 76, 79, 84, 81, 79, 76,
        74, 76, 79, 83, 86, 83, 79, 76,
    ]

    beat = 60 / 112
    step = beat / 2
    k = 0
    while k * step < DURATION:
        start = k * step
        add_note(
            music,
            melody[k % len(melody)],
            start,
            min(0.24, DURATION - start),
            0.047,
        )
        k += 1

    # Soft synthesized beat: no external music samples.
    for beat_i, start in enumerate(np.arange(0, DURATION, beat)):
        dur = 0.16
        count = int(dur * SR)
        q = np.arange(count, dtype=np.float32) / SR

        kick = np.sin(2 * np.pi * (92 - 40 * q / dur) * q)
        kick *= np.exp(-q * 24)
        add_stereo(music, kick, start, 0.075)

        if beat_i % 2 == 1:
            noise = rng.standard_normal(count).astype(np.float32)
            noise *= np.exp(-q * 35)
            add_stereo(music, noise, start, 0.012)

    return music

def timestamp(seconds):
    millis = int(round(seconds * 1000))
    h, millis = divmod(millis, 3600000)
    m, millis = divmod(millis, 60000)
    s, millis = divmod(millis, 1000)
    return f"{h:02}:{m:02}:{s:02},{millis:03}"

def main():
    if len(sys.argv) != 5:
        raise SystemExit(
            "Usage: python mix.py lines.json voices_dir mix.wav captions.srt"
        )

    lines_path = Path(sys.argv[1])
    voice_dir = Path(sys.argv[2])
    output_path = Path(sys.argv[3])
    srt_path = Path(sys.argv[4])

    lines = json.loads(lines_path.read_text(encoding="utf-8"))
    durations = json.loads((voice_dir / "dur.json").read_text())

    voice_track = np.zeros((N, 2), dtype=np.float32)
    spans = []

    # Position voice clips using the exact timestamps in lines.json.
    for line in sorted(lines, key=lambda item: float(item["t"])):
        line_id = str(line["id"])
        start = float(line["t"])
        wav_path = voice_dir / f"{line_id}.wav"

        if not wav_path.is_file():
            raise SystemExit(f"Voice clip missing: {wav_path}")

        audio, source_sr = sf.read(wav_path, dtype="float32")
        if audio.ndim > 1:
            audio = audio.mean(axis=1)

        if source_sr != SR:
            new_len = round(len(audio) * SR / source_sr)
            old_x = np.arange(len(audio), dtype=np.float64)
            new_x = np.arange(new_len, dtype=np.float64) * source_sr / SR
            audio = np.interp(new_x, old_x, audio).astype(np.float32)

        peak = float(np.max(np.abs(audio)))
        if peak < 1e-7 or not np.isfinite(peak):
            raise SystemExit(f"Invalid or silent voice clip: {line_id}")

        audio *= 0.72 / peak

        end = start + len(audio) / SR
        if start < 0 or end > DURATION:
            raise SystemExit(
                f"Voice line {line_id} runs outside the 30-second video: "
                f"{start:.2f}s to {end:.2f}s"
            )

        add_stereo(voice_track, audio, start)
        spans.append((start, end))

        print(
            f"Placed {line_id}: {start:.2f}s - {end:.2f}s",
            flush=True,
        )

    music = make_music()
    fx = np.zeros((N, 2), dtype=np.float32)

    # Clinic thermometer beep.
    add_sweep(fx, 7.15, 0.22, 780, 1250, 0.16)

    # Phone notification and a small paper shuffle.
    add_sweep(fx, 10.8, 0.12, 1100, 1500, 0.12)
    add_sweep(fx, 19.0, 0.38, 700, 180, 0.09)

    # Comedic record-scratch and final chime.
    add_sweep(fx, 24.0, 0.42, 1400, 110, 0.13)
    add_sweep(fx, 27.75, 0.32, 520, 1050, 0.12)

    # Duck the score under dialogue with short ramps.
    duck = np.ones(N, dtype=np.float32)

    for start, end in spans:
        a = max(0, int((start - 0.18) * SR))
        b = max(a, int((start - 0.05) * SR))
        c = min(N, int((end + 0.06) * SR))
        d = min(N, int((end + 0.30) * SR))

        if b > a:
            duck[a:b] = np.minimum(
                duck[a:b],
                np.linspace(1.0, 0.24, b - a, dtype=np.float32),
            )
        if c > b:
            duck[b:c] = np.minimum(duck[b:c], 0.24)
        if d > c:
            duck[c:d] = np.minimum(
                duck[c:d],
                np.linspace(0.24, 1.0, d - c, dtype=np.float32),
            )

    mixed = music * duck[:, None] + fx * 0.65 + voice_track

    peak = float(np.max(np.abs(mixed)))
    if peak > 0.95:
        mixed *= 0.95 / peak

    output_path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(output_path, mixed, SR, subtype="PCM_24")

    # Also export separate subtitle file.
    srt_lines = []
    for i, line in enumerate(sorted(lines, key=lambda item: float(item["t"]))):
        start = float(line["t"])
        line_id = str(line["id"])
        length = float(durations[line_id])

        next_start = (
            float(sorted(lines, key=lambda item: float(item["t"]))[i + 1]["t"])
            if i + 1 < len(lines) else DURATION
        )

        end = min(start + length + 0.45, next_start - 0.08, DURATION - 0.1)
        if end <= start:
            end = min(start + length, DURATION)

        srt_lines.extend([
            str(i + 1),
            f"{timestamp(start)} --> {timestamp(end)}",
            str(line["text"]),
            "",
        ])

    srt_path.parent.mkdir(parents=True, exist_ok=True)
    srt_path.write_text("\n".join(srt_lines), encoding="utf-8")

    print(f"Audio mix created: {output_path}")
    print(f"Subtitles created: {srt_path}")
    print(f"Mix duration: {DURATION:.1f}s | peak: {np.max(np.abs(mixed)):.3f}")

if __name__ == "__main__":
    main()
