"""multipart — encode a form the way Workers AI's image models require.

Why this exists at all. `_cf_ai_run` posts JSON, which is what most Workers AI models take.
The FLUX.2 image models do not: their own changelog says "this image model uses multipart form
data inputs, even if you just have a prompt", and multi-reference editing only works when the
images are binary parts named `input_image_0` … `input_image_3`. Python's standard library has
no multipart encoder (that lives in `requests`, which this worker does not depend on), so the
boundary, the part headers and the CRLFs are ours to get right — and a malformed body is
answered with a 400 that says nothing useful about which part was wrong.

That is exactly why the encoder is its own module with no dependencies: the body it produces is
bytes, and `scripts/check-multipart.py` parses it back and asserts every part, on any machine,
with no token and no network. The hosted call is the part that cannot be tested here; the
encoding is the part that silently goes wrong.
"""
from __future__ import annotations

import uuid
from typing import Iterable, Mapping

# A recognizable prefix makes a captured body readable when something does go wrong; the uuid4
# hex behind it is what makes a collision with the payload practically impossible (128 bits).
BOUNDARY_PREFIX = "----dropbyform"


class MultipartError(ValueError):
    """A part that cannot be encoded. Written to be read by whoever assembled the call."""


def _check_name(what: str, value: str) -> None:
    """Part names and filenames go inside a quoted header, so a quote or a newline in one is a
    header injection — a second header, or a part that the server reads differently than we do.
    The names here are ours, which is exactly why a guard is cheap: a future caller passing a
    user's own string must fail loudly instead of quietly building a different request."""
    if not value:
        raise MultipartError(f"{what} is empty")
    if any(ch in value for ch in ('"', "\r", "\n")):
        raise MultipartError(f"{what} {value!r} contains a quote or a newline")


def encode(
    fields: Mapping[str, object] | None = None,
    files: Iterable[tuple[str, str, bytes, str]] | None = None,
    boundary: str | None = None,
) -> tuple[bytes, str]:
    """Build a multipart body. Returns `(body, content_type)`.

    `fields` is `{name: value}` — values are stringified, because a multipart part is text and
    `width=1024` arriving as an int is a caller's convenience, not the wire format.

    `files` is a sequence of `(name, filename, data, content_type)`, in the order they should
    appear. Order is kept rather than sorted: the model's own docs reference images *by index*
    ("take the subject of image 1 and style it like image 0"), so which part is `input_image_0`
    is part of the request's meaning.
    """
    b = boundary or f"{BOUNDARY_PREFIX}{uuid.uuid4().hex}"
    _check_name("boundary", b)

    parts: list[bytes] = []
    for name, value in (fields or {}).items():
        _check_name("field name", str(name))
        parts.append(
            f'--{b}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
        )
    for name, filename, data, ctype in files or ():
        _check_name("file name", name)
        _check_name("filename", filename)
        if not isinstance(data, (bytes, bytearray)):
            raise MultipartError(f"the data for {name} must be bytes, not {type(data).__name__}")
        head = (
            f'--{b}\r\nContent-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'
            f"Content-Type: {ctype}\r\n\r\n"
        )
        parts.append(head.encode() + bytes(data) + b"\r\n")
    parts.append(f"--{b}--\r\n".encode())

    return b"".join(parts), f"multipart/form-data; boundary={b}"


def parse(body: bytes, content_type: str) -> tuple[dict[str, str], list[tuple[str, str, bytes]]]:
    """Read a body this module built back into `(fields, files)`.

    Deliberately a reader rather than a validating parser: it exists for the check and for
    triaging a captured request, and it asserts nothing about what it finds. The server is the
    authority on the format; this is how we look at what we actually sent.
    """
    marker = "boundary="
    if marker not in content_type:
        raise MultipartError("the content type carries no boundary")
    b = content_type.split(marker, 1)[1].strip().strip('"')
    delimiter = f"--{b}".encode()
    if not body.startswith(delimiter):
        raise MultipartError("the body does not start with its boundary")

    fields: dict[str, str] = {}
    files: list[tuple[str, str, bytes]] = []
    for chunk in body.split(delimiter)[1:]:
        if chunk.startswith(b"--"):
            break
        chunk = chunk.lstrip(b"\r\n")
        if b"\r\n\r\n" not in chunk:
            continue
        head, payload = chunk.split(b"\r\n\r\n", 1)
        payload = payload[:-2] if payload.endswith(b"\r\n") else payload  # the part's own CRLF
        headers = {}
        for line in head.decode("utf-8", "replace").split("\r\n"):
            if ":" in line:
                k, v = line.split(":", 1)
                headers[k.strip().lower()] = v.strip()
        disposition = headers.get("content-disposition", "")
        name = ""
        if 'name="' in disposition:
            name = disposition.split('name="', 1)[1].split('"', 1)[0]
        if "filename=" in disposition:
            filename = disposition.split('filename="', 1)[1].split('"', 1)[0]
            files.append((name, filename, payload))
        elif name:
            fields[name] = payload.decode("utf-8", "replace")
    return fields, files
