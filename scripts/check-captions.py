#!/usr/bin/env python3
"""check-captions.py — the subtitle rules, asserted with nothing installed.

The transcription is a hosted call and cannot be tested here (no token on a dev checkout).
Everything the transcription is turned *into* can be, and that is where the quiet defects
are: a short-form timestamp SRT will not accept, a cue setting left on the timing line, a
speaker tag printed into the caption, numbering that starts at 0. Those are string
arithmetic, they live in `services/tools/captions.py`, and this file asserts them.

Run:  python3 scripts/check-captions.py     (or `python` on Windows)
Exit: 0 every rule holds, 1 something is wrong
"""
from __future__ import annotations

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "services" / "tools"))

import captions as C  # noqa: E402  (path set above on purpose)

OK = 0
BAD = 0


def check(what: str, cond: bool, detail: str = "") -> None:
    global OK, BAD
    if cond:
        OK += 1
        print(f"  ok   {what}")
    else:
        BAD += 1
        print(f"  FAIL {what}{f' — {detail}' if detail else ''}")


def raises(what: str, fn, needle: str = "") -> None:
    try:
        fn()
    except C.CaptionError as exc:
        check(what, needle.lower() in str(exc).lower(), f"message was {str(exc)!r}")
    except Exception as exc:  # noqa: BLE001
        check(what, False, f"raised {type(exc).__name__} not CaptionError: {exc}")
    else:
        check(what, False, "did not raise")


# A transcript shaped the way Whisper actually answers: a header with metadata, a NOTE, a cue
# with its own identifier, cue settings after the arrow, a short-form timestamp, a speaker tag,
# a cue whose body is only markup, and a cue whose text wraps over two lines.
VTT = """WEBVTT
Kind: captions
Language: en

NOTE this block is not a cue

1
00:00:01.000 --> 00:00:03.500 align:start position:0%
Hello and welcome to the shop.

00:04.000 --> 00:06.000
<v Ramesh>Today we are making a bill.

00:00:07.000 --> 00:00:08.000
<c.yellow></c>

00:00:08.000 --> 00:00:10.250
It takes
two minutes.
"""


def main() -> int:
    print("check-captions — the subtitle rules for the subtitles product\n")

    print("timestamps")
    check("HH:MM:SS.mmm becomes SRT's comma form", C.parse_time("00:00:01.000") == "00:00:01,000")
    check("a short MM:SS.mmm is padded, not rejected", C.parse_time("00:04.000") == "00:00:04,000")
    check("one-digit milliseconds are padded to three", C.parse_time("01:02:03.5") == "01:02:03,500")
    check("an hour group is kept", C.parse_time("12:34:56.789") == "12:34:56,789")
    check("a comma separator is accepted too", C.parse_time("00:00:09,250") == "00:00:09,250")
    check("seconds are rounded, not truncated", C._from_seconds(1.5) == "00:00:01,500")
    check("an hour of seconds rolls over", C._from_seconds(3600.0) == "01:00:00,000")
    check("a negative time clamps to zero", C._from_seconds(-4) == "00:00:00,000")
    raises("nonsense is refused, not guessed at", lambda: C.parse_time("soon"), "not a timestamp")

    print("\nparsing a real transcript")
    cues = C.cues_from_vtt(VTT)
    check("the header, the NOTE and the markup-only cue are not cues",
          len(cues) == 3, f"got {len(cues)}")
    check("the first cue's window is exact",
          cues[0]["start"] == "00:00:01,000" and cues[0]["end"] == "00:00:03,500",
          f"got {cues[0]['start']} → {cues[0]['end']}")
    check("a cue's own identifier line is skipped",
          cues[0]["text"] == "Hello and welcome to the shop.", f"got {cues[0]['text']!r}")
    check("cue settings after the arrow are dropped",
          cues[0]["end"] == "00:00:03,500")
    check("a short-form timestamp is normalised in place",
          cues[1]["start"] == "00:00:04,000", f"got {cues[1]['start']}")
    check("a speaker tag does not reach the caption",
          cues[1]["text"] == "Today we are making a bill.", f"got {cues[1]['text']!r}")
    check("a cue wrapping over two lines becomes one line",
          cues[2]["text"] == "It takes two minutes.", f"got {cues[2]['text']!r}")
    check("a cue whose body is only markup is dropped, not kept blank",
          all("yellow" not in c["text"] for c in cues))
    check("order is preserved", [c["start"] for c in cues] == sorted(c["start"] for c in cues))

    print("\nthe SRT a reel editor imports")
    srt = C.to_srt(cues)
    check("it is numbered from 1", srt.startswith("1\n"))
    check("numbering is contiguous",
          [ln for ln in srt.splitlines() if ln.isdigit()] == ["1", "2", "3"])
    check("every timestamp is the comma form",
          "00:00:01,000 --> 00:00:03,500" in srt)
    check("no dot-form timestamp survives", "." not in srt.split("-->")[1].split("\n")[0])
    check("blocks are separated by a blank line", "\n\n2\n" in srt)
    check("no VTT header or NOTE leaks into the SRT",
          "WEBVTT" not in srt and "NOTE" not in srt)
    check("the speaker tag is gone", "<v " not in srt)
    check("it ends with a newline", srt.endswith("\n"))

    round_trip = C.cues_from_vtt(srt)
    check("the SRT parses back to the same cues",
          [(c["start"], c["end"], c["text"]) for c in round_trip]
          == [(c["start"], c["end"], c["text"]) for c in cues])

    print("\nthe other two shapes")
    vtt = C.to_vtt(cues)
    check("VTT starts with its magic line", vtt.startswith("WEBVTT\n"))
    check("VTT timestamps use dots", "00:00:01.000 --> 00:00:03.500" in vtt)
    check("VTT cues are not numbered", "\n1\n" not in vtt)
    check("the plain transcript is the words in order",
          C.to_plain(cues).startswith("Hello and welcome")
          and C.to_plain(cues).endswith("It takes two minutes."))

    print("\nthe meta a job row carries")
    d = C.describe(cues)
    check("it counts the cues", d["cues"] == 3, f"got {d['cues']}")
    check("it counts the words", d["words"] == len(C.to_plain(cues).split()),
          f"got {d['words']}")
    check("it reports the last cue's end", d["last_cue_end"] == "00:00:10,250")
    check("it reports the transcribed span in minutes",
          abs(C.span_minutes(cues) - (10.25 / 60)) < 1e-9, f"got {C.span_minutes(cues)}")
    check("an empty transcript spans nothing", C.span_minutes([]) == 0.0)
    check("extra facts are merged in", C.describe(cues, {"model": "m"})["model"] == "m")

    print("\nthe model's answer")
    from_vtt, text = C.subtitles_from_answer({"vtt": VTT})
    check("the rendered vtt is preferred", len(from_vtt) == 3)
    check("the transcript is rebuilt from it when the answer has none",
          text.startswith("Hello and welcome"), f"got {text[:40]!r}")
    check("a transcript the answer does provide is used verbatim",
          C.subtitles_from_answer({"vtt": VTT, "text": "the model's own transcript"})[1]
          == "the model's own transcript")
    segs, text2 = C.subtitles_from_answer({"segments": [
        {"start": 0, "end": 2.5, "text": " One "},
        {"start": 2.5, "end": 4, "text": "two"},
        {"start": "x", "end": 4, "text": "bad row"},
        {"start": 4, "end": 5, "text": "   "},
    ]})
    check("it falls back to the segments when there is no vtt", len(segs) == 2, f"got {len(segs)}")
    check("segment seconds become timestamps",
          (segs[0]["start"], segs[0]["end"]) == ("00:00:00,000", "00:00:02,500"),
          f"got {segs[0]['start']} → {segs[0]['end']}")
    check("a segment row that is not a segment is skipped",
          all(c["text"] in ("One", "two") for c in segs))
    check("the transcript is rebuilt when the answer has none", text2 == "One two")
    raises("an answer with no timed lines is refused, not written empty",
           lambda: C.subtitles_from_answer({"text": "hello"}), "no timed lines")
    raises("an answer that is not an object is refused",
           lambda: C.subtitles_from_answer("nope"), "not an object")
    raises("an empty vtt with no segments is refused",
           lambda: C.subtitles_from_answer({"vtt": "WEBVTT\n\n"}), "no timed lines")

    print(f"\n{'✓ every caption rule holds' if not BAD else '✗ the captions are wrong'} — {OK} ok, {BAD} failed")
    return 1 if BAD else 0


if __name__ == "__main__":
    sys.exit(main())
