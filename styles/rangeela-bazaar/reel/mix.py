import json
import math
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 48000
DURATION = 90.0
N = int(SR * DURATION)
RNG = np.random.default_rng(20261112)


def add_stereo(dst, mono, start, gain=1.0, pan=0.0):
    pan = float(np.clip(pan, -1.0, 1.0))
    start_i = max(0, int(round(start * SR)))
    if start_i >= len(dst):
        return

    mono = np.asarray(mono, dtype=np.float32).reshape(-1)
    count = min(len(mono), len(dst) - start_i)
    if count <= 0:
        return

    left = math.sqrt(1.0 - pan)
    right = math.sqrt(1.0 + pan)
    dst[start_i:start_i + count, 0] += mono[:count] * gain * left
    dst[start_i:start_i + count, 1] += mono[:count] * gain * right


def add_note(dst, midi, start, duration, gain, pan=0.0):
    count = int(duration * SR)
    if count <= 0:
        return

    t = np.arange(count, dtype=np.float32) / SR
    freq = 440.0 * 2.0 ** ((midi - 69) / 12.0)
    phase = 2.0 * np.pi * freq * t

    # Original, soft plucked tone with light harmonics.
    wave = (
        np.sin(phase)
        + 0.22 * np.sin(2.0 * phase)
        + 0.07 * np.sin(3.0 * phase)
    )

    attack = np.clip(t / 0.045, 0.0, 1.0)
    release = np.clip((duration - t) / 0.24, 0.0, 1.0)
    envelope = np.minimum(attack, release) ** 0.8

    add_stereo(dst, wave * envelope, start, gain, pan)


def add_sweep(dst, start, duration, f0, f1, gain, pan=0.0):
    count = int(duration * SR)
    if count <= 0:
        return

    t = np.arange(count, dtype=np.float32) / SR
    phase = 2.0 * np.pi * (
        f0 * t + 0.5 * (f1 - f0) * t * t / duration
    )
    envelope = np.clip(np.sin(np.linspace(0.0, np.pi, count, dtype=np.float32)), 0.0, 1.0) ** 1.5
    add_stereo(dst, np.sin(phase) * envelope, start, gain, pan)


def add_noise(dst, start, duration, gain, pan=0.0):
    count = int(duration * SR)
    if count <= 0:
        return

    noise = RNG.standard_normal(count).astype(np.float32)
    envelope = np.clip(
        np.sin(np.linspace(0.0, np.pi, count, dtype=np.float32)),
        0.0, 1.0
    ) ** 1.5
    add_stereo(dst, noise * envelope, start, gain, pan)


def make_music():
    music = np.zeros((N, 2), dtype=np.float32)

    # Four-chord, playful original instrumental bed.
    chords = [
        [57, 60, 64, 67],  # A minor
        [53, 57, 60, 64],  # F major
        [55, 59, 62, 67],  # G major
        [52, 55, 59, 64],  # E minor
    ]

    bar = 2.4
    beat = bar / 4.0
    pattern = [0, 2, 1, 2]

    for bar_index in range(math.ceil(DURATION / bar)):
        start = bar_index * bar
        chord = chords[(bar_index // 2) % len(chords)]
        remaining = DURATION - start
        if remaining <= 0:
            break

        # Gentle chord pad.
        for note in chord[:3]:
            add_note(
                music, note, start, min(bar * 0.96, remaining),
                0.010, pan=-0.12
            )

        # Bright marimba-like arpeggio.
        for beat_index, chord_index in enumerate(pattern):
            note_start = start + beat_index * beat
            if note_start >= DURATION:
                continue

            add_note(
                music,
                chord[chord_index] + 12,
                note_start,
                min(0.34, DURATION - note_start),
                0.030,
                pan=(-0.22 if beat_index % 2 == 0 else 0.22),
            )

            # Soft kick pulse.
            add_sweep(
                music, note_start, 0.12, 100, 42, 0.018
            )

        # Light high percussion on alternating beats.
        for beat_index in (1, 3):
            tick = start + beat_index * beat
            if tick < DURATION:
                add_noise(music, tick, 0.045, 0.004, pan=0.35)

    return music


def timestamp(seconds):
    millis = int(round(seconds * 1000))
    hours, millis = divmod(millis, 3600000)
    minutes, millis = divmod(millis, 60000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


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
    durations = json.loads((voice_dir / "dur.json").read_text(encoding="utf-8"))

    if not isinstance(lines, list) or not lines:
        raise SystemExit("lines.json must contain a non-empty list")

    ordered = sorted(lines, key=lambda item: float(item["t"]))
    voice_track = np.zeros((N, 2), dtype=np.float32)
    spans = []

    for line in ordered:
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
        if not np.isfinite(peak) or peak < 1e-7:
            raise SystemExit(f"Invalid or silent voice clip: {line_id}")

        audio *= 0.72 / peak
        end = start + len(audio) / SR

        if start < 0 or end > DURATION:
            raise SystemExit(
                f"Voice line {line_id} outside 90-second video: "
                f"{start:.2f}s to {end:.2f}s"
            )

        add_stereo(voice_track, audio, start)
        spans.append((start, end))
        print(f"Placed {line_id}: {start:.2f}s - {end:.2f}s", flush=True)

    # Original synthesized music, generated for the full 90 seconds.
    music = make_music()
    fx = np.zeros((N, 2), dtype=np.float32)

    # Bazaar introduction and bargaining accents.
    add_sweep(fx, 0.35, 0.42, 720, 1450, 0.075)
    add_noise(fx, 16.0, 0.20, 0.025, pan=-0.25)
    add_sweep(fx, 20.1, 0.34, 980, 420, 0.10)
    add_sweep(fx, 36.1, 0.48, 1350, 180, 0.11)
    add_noise(fx, 40.0, 0.22, 0.025, pan=0.2)

    # Uncle's polite entrance.
    add_sweep(fx, 48.0, 0.65, 620, 1600, 0.085)
    add_note(fx, 76, 48.55, 0.75, 0.035)
    add_note(fx, 81, 48.82, 0.85, 0.030, pan=0.18)

    # Final price-change reveal.
    add_sweep(fx, 79.9, 0.72, 1500, 95, 0.14)
    add_note(fx, 84, 81.0, 0.65, 0.045)
    add_note(fx, 88, 81.25, 0.75, 0.035, pan=0.15)

    # Duck the music under every spoken line.
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

    # Dialogue subtitles, timed to generated voice durations.
    srt_lines = []
    for index, line in enumerate(ordered):
        line_id = str(line["id"])
        start = float(line["t"])
        length = float(durations[line_id])

        next_start = (
            float(ordered[index + 1]["t"])
            if index + 1 < len(ordered)
            else DURATION
        )

        end = min(start + length + 0.35, next_start - 0.08, DURATION - 0.1)
        if end <= start:
            end = min(start + max(length, 0.5), DURATION - 0.1)

        srt_lines.extend([
            str(index + 1),
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
