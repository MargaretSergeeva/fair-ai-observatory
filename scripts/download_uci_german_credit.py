"""Download and validate the official UCI German Credit dataset."""

from __future__ import annotations

import argparse
import hashlib
import io
import urllib.request
from pathlib import Path
from zipfile import ZipFile


DATASET_URL = (
    "https://archive.ics.uci.edu/static/public/144/"
    "statlog%2Bgerman%2Bcredit%2Bdata.zip"
)
ARCHIVE_SHA256 = "e12d9d5def6845c0622634a1cd2ab87fa470668c4298f1ec52a4e403376a435b"
ARCHIVE_MEMBER = "german.data"
EXPECTED_ROWS = 1000
EXPECTED_COLUMNS = 21


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download the official UCI Statlog German Credit dataset."
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/raw/german_credit/german.data"),
        help="Destination for the validated german.data file.",
    )
    return parser.parse_args()


def validate_dataset(*, payload: bytes) -> None:
    lines = payload.decode("ascii").splitlines()
    if len(lines) != EXPECTED_ROWS:
        raise ValueError(f"expected {EXPECTED_ROWS} rows, received {len(lines)}")

    invalid_rows = [
        index
        for index, line in enumerate(lines, start=1)
        if len(line.split()) != EXPECTED_COLUMNS
    ]
    if invalid_rows:
        raise ValueError(
            f"expected {EXPECTED_COLUMNS} columns; invalid rows: {invalid_rows[:10]}"
        )


def download_dataset(*, output: Path) -> None:
    with urllib.request.urlopen(DATASET_URL, timeout=30) as response:
        archive = response.read()

    actual_sha256 = hashlib.sha256(archive).hexdigest()
    if actual_sha256 != ARCHIVE_SHA256:
        raise ValueError(
            "archive checksum mismatch: "
            f"expected {ARCHIVE_SHA256}, received {actual_sha256}"
        )

    with ZipFile(io.BytesIO(archive)) as zip_file:
        if ARCHIVE_MEMBER not in zip_file.namelist():
            raise ValueError(f"archive does not contain {ARCHIVE_MEMBER}")
        payload = zip_file.read(ARCHIVE_MEMBER)

    validate_dataset(payload=payload)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(payload)
    print(f"Downloaded {EXPECTED_ROWS} rows to {output}")
    print(f"Archive SHA-256: {actual_sha256}")


def main() -> None:
    args = parse_args()
    download_dataset(output=args.output)


if __name__ == "__main__":
    main()
