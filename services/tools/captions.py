"""captions — WebVTT in, subtitles out, with no model and no renderer in it.

Why this module exists. The transcription itself is a hosted call (Workers AI's
`@cf/openai/whisper-large-v3-turbo`, which answers with a `vtt` string), and a hosted call
is exactly the part that cannot be tested on a machine that holds no token. Everything
*after* it can be, and it is where the quiet bugs live: a short-form `MM:SS.mmm` timestamp
that SRT does not accept, a cue setting (`align:start position:0%`) left glued to the
timestamp, a speaker tag (`<v Speaker>`) printed into the subtitle, a cue numbered from 0.
Those are all string arithmetic, so they live here, import nothing, and are asserted by
`scripts/check-captions.py` with plain `python3`.

The other half of the same idea: the engine may answer with `vtt`, or with only `segments`.
`cues_from_segments()` covers the second shape, so a model that stops emitting the rendered
caption block does not silently produce an empty subtitle file.

Times everywhere are `HH:MM:SS,mmm` strings already normalised, because SRT is the format a
reel editor imports and it is the strictest of the two.
"""
from __future__ import annotations

import re
from typing import Any

# A cue timing line: `00:00:01.000 --> 00:00:04.000` with optional settings after the arrow,
# and the leading hours group optional (`00:01.000 --> 00:04.000`). Whisper emits both.
_TIMING = re.compile(
    r"^\s*(?P<start>(?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{1,3})\s*-->\s*"
    r"(?P<end>(?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{1,3})\s*(?P<settings>.*)$"
)
# `HH:MM:SS.mmm`, `MM:SS.mmm` or `SS.mmm`, in either separator.
_TIME = re.compile(r"^(?:(\d{1,2}):)?(?:(\d{1,2}):)?(\d{1,2})[.,](\d{1,3})$")
# Inline VTT tags: `<v Speaker>`, `<c.classname>`, karaoke `<00:00:02.000>`, `<b>`. All of
# them are markup for a player that is not here; in an SRT they print as literal noise.
_TAG = re.compile(r"<[^>]*>")


class CaptionError(ValueError):
    """There is nothing usable in the transcript. Written to be read by the caller."""


def parse_time(value: str) -> str:
    """Any VTT timestamp to `HH:MM:SS,mmm` (SRT's shape). Raises `CaptionError`."""
    m = _TIME.match(value.strip())
    if not m:
        raise CaptionError(f"{value!r} is not a timestamp")
    a, b, c, ms = m.groups()
    # The regex has two optional colon groups, so the meaning depends on how many matched:
    # `a:b:c` is hours:minutes:seconds, `a:c` is minutes:seconds, and `c` alone is seconds.
    if b is not None:                  # HH:MM:SS.mmm
        hours, minutes, seconds = int(a), int(b), int(c)
    elif a is not None:                # MM:SS.mmm
        hours, minutes, seconds = 0, int(a), int(c)
    else:                              # SS.mmm — legal in VTT, odd in a caption
        hours, minutes, seconds = 0, 0, int(c)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{int(ms.ljust(3, '0')):03d}"


def clean_text(lines: list[str]) -> str:
    """Cue body with markup removed and whitespace collapsed. May be empty."""
    body = " ".join(_TAG.sub("", line) for line in lines)
    return " ".join(body.split())


def cues_from_vtt(vtt: str) -> list[dict]:
    """Parse a WebVTT document into `[{start, end, text}]`, in file order.

    Blocks that are not cues (the `WEBVTT` header, `NOTE` comments, `STYLE`) are skipped,
    and a cue whose text is only markup is dropped — a line with nothing to say is not a
    subtitle, and keeping it would put a blank frame in the middle of a video.
    """
    cues: list[dict] = []
    for block in re.split(r"\r?\n\s*\r?\n", (vtt or "").strip()):
        lines = [ln for ln in block.splitlines() if ln.strip()]
        if not lines:
            continue
        head = lines[0].strip()
        if head.upper().startswith(("WEBVTT", "NOTE", "STYLE", "REGION")):
            continue
        # A cue may carry an identifier on its own line before the timing.
        if "-->" in lines[0]:
            timing, rest = lines[0], lines[1:]
        elif len(lines) > 1 and "-->" in lines[1]:
            timing, rest = lines[1], lines[2:]
        else:
            continue
        m = _TIMING.match(timing)
        if not m:
            continue
        text = clean_text(rest)
        if not text:
            continue
        cues.append({"start": parse_time(m.group("start")),
                     "end": parse_time(m.group("end")), "text": text})
    return cues


def cues_from_segments(segments: Any) -> list[dict]:
    """The model's `segments` turned into the same cue shape, for answers with no `vtt`."""
    cues: list[dict] = []
    if not isinstance(segments, list):
        return cues
    for seg in segments:
        if not isinstance(seg, dict):
            continue
        start, end = seg.get("start"), seg.get("end")
        text = clean_text([str(seg.get("text") or "")])
        if start is None or end is None or not text:
            continue
        try:
            # Segments are seconds as a number; whisper.cpp and Workers AI both do this.
            s, e = float(start), float(end)
        except (TypeError, ValueError):
            continue
        cues.append({"start": _from_seconds(s), "end": _from_seconds(e), "text": text})
    return cues


def _from_seconds(seconds: float) -> str:
    if seconds < 0:
        seconds = 0.0
    total_ms = int(round(seconds * 1000))
    hours, rest = divmod(total_ms, 3_600_000)
    minutes, rest = divmod(rest, 60_000)
    secs, ms = divmod(rest, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"


def to_srt(cues: list[dict]) -> str:
    """Numbered SRT, and the numbering is this function's job, not the model's."""
    blocks = []
    for i, cue in enumerate(cues, 1):
        blocks.append(f"{i}\n{cue['start']} --> {cue['end']}\n{cue['text']}")
    return "\n\n".join(blocks) + ("\n" if blocks else "")


def to_vtt(cues: list[dict]) -> str:
    """A WebVTT file rebuilt from the cues — normalised, with dots and no numbering."""
    blocks = [f"{c['start'].replace(',', '.')} --> {c['end'].replace(',', '.')}\n{c['text']}"
              for c in cues]
    return "WEBVTT\n\n" + "\n\n".join(blocks) + ("\n" if blocks else "")


def to_plain(cues: list[dict]) -> str:
    return " ".join(c["text"] for c in cues)


def span_minutes(cues: list[dict]) -> float:
    """Minutes from 00:00 to the end of the last cue.

    This is the span that was *read*, and it is the only duration the engine actually knows:
    the model answers with timings, not with the audio's own length, so a job's cost is
    computed from this and the meta says `transcribed_minutes` rather than `audio_minutes`.
    """
    if not cues:
        return 0.0
    hours, minutes, rest = cues[-1]["end"].split(":")
    seconds, millis = rest.split(",")
    total = int(hours) * 3600 + int(minutes) * 60 + int(seconds) + int(millis) / 1000
    return total / 60.0


def describe(cues: list[dict], extra: dict | None = None) -> dict:
    """The meta a job row carries: what was read, not what was hoped for."""
    words = sum(len(c["text"].split()) for c in cues)
    last = cues[-1]["end"] if cues else "00:00:00,000"
    out = {
        "cues": len(cues),
        "words": words,
        "chars": sum(len(c["text"]) for c in cues),
        "last_cue_end": last,
    }
    out.update(extra or {})
    return out


def subtitles_from_answer(result: Any) -> tuple[list[dict], str]:
    """Cues + transcript from a whisper-shaped answer.

    Prefers the model's own rendered `vtt` (it carries the segmentation decision it actually
    made) and falls back to `segments`. Raises when neither yields a single cue — a 200 with
    an empty transcript is not a subtitle file, and answering with an empty one would look
    like a successful job.
    """
    if not isinstance(result, dict):
        raise CaptionError("the transcription answer was not an object")
    cues = cues_from_vtt(str(result.get("vtt") or ""))
    if not cues:
        cues = cues_from_segments(result.get("segments"))
    if not cues:
        raise CaptionError(
            "the transcription came back with no timed lines — there was no speech to read, "
            "or the audio could not be decoded"
        )
    text = clean_text([str(result.get("text") or "")]) or to_plain(cues)
    return cues, text
