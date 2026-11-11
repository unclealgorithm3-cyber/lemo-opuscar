import json
import os
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from huggingface_hub import snapshot_download
from kokoro_onnx import Kokoro
from misaki.espeak import EspeakG2P

REPO = "leonelhs/kokoro-thewh1teagle"
REVISION = "463d2d58c267a5c58b8989a73d171e153c50be20"

def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python tts_hindi.py lines.json output_dir")

    lines_path = Path(sys.argv[1])
    out_dir = Path(sys.argv[2])

    lines = json.loads(lines_path.read_text(encoding="utf-8"))
    if not isinstance(lines, list) or not lines:
        raise SystemExit("Narration file must contain a non-empty JSON list")

    print("Downloading/loading Hindi-capable Kokoro model...", flush=True)

    model_dir = Path(snapshot_download(
        repo_id=REPO,
        revision=REVISION,
        allow_patterns=["kokoro-v1.0.onnx", "voices-v1.0.bin"],
    ))

    model_path = model_dir / "kokoro-v1.0.onnx"
    voices_path = model_dir / "voices-v1.0.bin"

    if not model_path.is_file() or not voices_path.is_file():
        raise SystemExit("Kokoro model files are missing from the downloaded snapshot")

    print("Loading Hindi phonemizer...", flush=True)
    g2p = EspeakG2P(language="hi")

    print("Loading Kokoro...", flush=True)
    kokoro = Kokoro(str(model_path), str(voices_path))
    available = set(kokoro.get_voices())

    out_dir.mkdir(parents=True, exist_ok=True)
    durations = {}

    for line in lines:
        line_id = str(line["id"])
        text = str(line["text"]).strip()
        voice = str(line.get("voice", "hf_alpha"))
        speed = float(line.get("speed", 1.0))

        if not re.fullmatch(r"[A-Za-z0-9_-]+", line_id):
            raise SystemExit(f"Unsafe line ID: {line_id}")

        if voice not in available:
            raise SystemExit(
                f"Voice {voice!r} is not in the model. "
                f"Available voices: {', '.join(sorted(available))}"
            )

        if not text:
            raise SystemExit(f"Empty narration text: {line_id}")

        phonemes, _ = g2p(text)
        if not phonemes:
            raise SystemExit(f"Hindi phonemization returned empty text for {line_id}")

        audio, sample_rate = kokoro.create(
            phonemes,
            voice,
            speed,
            is_phonemes=True,
        )

        audio = np.asarray(audio, dtype=np.float32).squeeze()
        if audio.ndim != 1 or len(audio) == 0:
            raise SystemExit(f"Invalid generated audio for {line_id}")

        peak = float(np.max(np.abs(audio)))
        if not np.isfinite(peak) or peak < 1e-7:
            raise SystemExit(f"Silent or invalid audio generated for {line_id}")

        # Trim leading and trailing silence.
        nz = np.where(np.abs(audio) > peak * 0.02)[0]
        if len(nz):
            start = max(0, nz[0] - int(0.03 * sample_rate))
            end = min(len(audio), nz[-1] + int(0.08 * sample_rate))
            audio = audio[start:end]

        duration = len(audio) / sample_rate
        durations[line_id] = round(duration, 3)

        sf.write(
            out_dir / f"{line_id}.wav",
            audio,
            sample_rate,
            subtype="PCM_16",
        )

        print(
            f"{line_id}: {duration:.2f}s | {voice} | {text}",
            flush=True,
        )

    (out_dir / "dur.json").write_text(
        json.dumps(durations, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Generated {len(durations)} Hindi voice clips in {out_dir}")

if __name__ == "__main__":
    main()
