#!/usr/bin/env python3
"""check-multipart.py — the request body the FLUX.2 image models require, asserted locally.

Workers AI's image models take multipart form data rather than JSON, and the standard library
has no encoder for it, so the boundary and the part headers are ours. A body that is quietly
malformed comes back as a 400 that says nothing about which part was wrong — and the call
cannot be made from here at all (no token). So the encoding is asserted instead:
`services/tools/multipart.py` builds it and this file parses it back, on any machine.

Run:  python3 scripts/check-multipart.py     (or `python` on Windows)
Exit: 0 every rule holds, 1 something is wrong
"""
from __future__ import annotations

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "services" / "tools"))

import multipart as M  # noqa: E402  (path set above on purpose)

OK = 0
BAD = 0
PNG = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + bytes(range(256))  # binary, CRLFs, NULs, high bytes


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
    except M.MultipartError as exc:
        check(what, needle.lower() in str(exc).lower(), f"message was {str(exc)!r}")
    except Exception as exc:  # noqa: BLE001
        check(what, False, f"raised {type(exc).__name__} not MultipartError: {exc}")
    else:
        check(what, False, "did not raise")


def main() -> int:
    print("check-multipart — the form body the image models take\n")

    print("the exact bytes")
    body, ctype = M.encode({"prompt": "hi"}, boundary="X")
    check("a field part is three lines and a blank line",
          body == b'--X\r\nContent-Disposition: form-data; name="prompt"\r\n\r\nhi\r\n--X--\r\n',
          f"got {body!r}")
    check("the content type names the boundary", ctype == "multipart/form-data; boundary=X",
          f"got {ctype!r}")
    check("the body ends with the closing delimiter",
          body.endswith(b"--X--\r\n"), f"got {body[-12:]!r}")
    check("every line break is CRLF, never a bare LF",
          b"\n" not in body.replace(b"\r\n", b""))

    print("\nfields")
    fields, files = M.parse(*M.encode({"prompt": "a room", "width": 1024, "seed": 7}))
    check("a string field round-trips", fields.get("prompt") == "a room")
    check("an int field is stringified", fields.get("width") == "1024", f"got {fields.get('width')!r}")
    check("a second int field too", fields.get("seed") == "7")
    check("no file parts were invented", files == [], f"got {files}")
    weird = M.parse(*M.encode({"prompt": "line one\r\nline two"}))[0]
    check("a value may contain CRLF — it is payload, not a header",
          weird["prompt"] == "line one\r\nline two")

    print("\nfiles")
    b2, c2 = M.encode(
        {"prompt": "redesign this room"},
        [
            ("input_image_0", "room.png", PNG, "image/png"),
            ("input_image_1", "swatch.jpg", b"\xff\xd8\xff\xe0jpeg", "image/jpeg"),
        ],
    )
    f2, fl2 = M.parse(b2, c2)
    check("the field is still there beside the files", f2.get("prompt") == "redesign this room")
    check("both files arrive", len(fl2) == 2, f"got {len(fl2)}")
    check("part order is kept, because the model references images by index",
          [x[0] for x in fl2] == ["input_image_0", "input_image_1"], f"got {[x[0] for x in fl2]}")
    check("the filename survives", fl2[0][1] == "room.png")
    check("binary data survives byte for byte", fl2[0][2] == PNG,
          f"{len(fl2[0][2])} bytes back, {len(PNG)} sent")
    check("a second file's own content type is used",
          "image/jpeg" in b2.decode("latin-1"))
    check("an empty file is still a part", len(M.parse(*M.encode({}, [("a", "e.bin", b"", "application/octet-stream")]))[1]) == 1)

    print("\nthe boundary")
    _, c1 = M.encode({"a": "1"})
    _, c2b = M.encode({"a": "1"})
    check("two bodies do not share a boundary", c1 != c2b, f"both {c1!r}")
    check("the boundary is long enough to not collide",
          len(c1.split("boundary=")[1]) >= 40, f"got {len(c1.split('boundary=')[1])}")
    check("an explicit boundary is honoured", "boundary=X" in ctype)

    print("\nrefusals, because a header is not a place for a user's string")
    raises("a quote in a field name is refused",
           lambda: M.encode({'pro"mpt': "x"}), "quote")
    raises("a newline in a field name is refused",
           lambda: M.encode({"pro\nmpt": "x"}), "newline")
    raises("an empty field name is refused", lambda: M.encode({"": "x"}), "empty")
    raises("a newline in a filename is refused",
           lambda: M.encode({}, [("input_image_0", "a\r\nb.png", b"x", "image/png")]), "newline")
    raises("file data that is not bytes is refused",
           lambda: M.encode({}, [("input_image_0", "a.png", "not bytes", "image/png")]), "bytes")
    raises("a body without a boundary in its content type cannot be read",
           lambda: M.parse(b"--X--\r\n", "multipart/form-data"), "no boundary")
    raises("a body that does not start with its boundary cannot be read",
           lambda: M.parse(b"junk", "multipart/form-data; boundary=X"), "start with")

    print(f"\n{'✓ every multipart rule holds' if not BAD else '✗ the encoding is wrong'} — {OK} ok, {BAD} failed")
    return 1 if BAD else 0


if __name__ == "__main__":
    sys.exit(main())
