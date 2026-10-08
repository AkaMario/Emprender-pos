"""Compatibility entry point: validate the active model and repositories in memory."""
from pathlib import Path
import subprocess
import sys

if __name__ == "__main__":
    sys.exit(subprocess.run(["npm", "test"], cwd=Path(__file__).resolve().parents[1]).returncode)
