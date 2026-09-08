import sys
import os
import shutil
import subprocess
from pathlib import Path

def main() -> None:
    """
    Launch the InTellectual VCT Protocol Interface.

    Options:
      - Default: Launches the state-of-the-art Next.js 15 kinetic cyber-glass dashboard.
      - --legacy / --streamlit: Launches the legacy Streamlit Python dashboard.
      - --build: Builds the production Next.js static bundle.
    """
    project_root = Path(__file__).resolve().parents[2]

    # Legacy Streamlit flag
    if "--legacy" in sys.argv or "--streamlit" in sys.argv:
        app_path = project_root / "app.py"
        args = [arg for arg in sys.argv[1:] if arg not in ("--legacy", "--streamlit")]
        cmd = [sys.executable, "-m", "streamlit", "run", str(app_path)] + args
        print("[InTellectual] Launching legacy Streamlit runner...")
        subprocess.run(cmd, check=True)
        return

    # Production build flag
    if "--build" in sys.argv:
        print("[InTellectual] Building Next.js production build...")
        subprocess.run("npm run build", cwd=str(project_root), shell=True, check=True)
        return

    # Default: Next.js dev server
    print("[InTellectual] Booting VCT Protocol Kinetic Interface (Next.js)...")
    print("[InTellectual] Local URL: http://localhost:3000")
    print("[InTellectual] Tip: Pass --legacy or --streamlit to run legacy Streamlit.")

    npm_bin = shutil.which("npm") or shutil.which("npx")
    if npm_bin:
        try:
            subprocess.run("npm run dev", cwd=str(project_root), shell=True, check=True)
        except KeyboardInterrupt:
            print("\n[InTellectual] Server shutdown.")
            sys.exit(0)
    else:
        print("[InTellectual] Node.js/npm not detected in PATH. Falling back to Streamlit...")
        app_path = project_root / "app.py"
        subprocess.run([sys.executable, "-m", "streamlit", "run", str(app_path)], check=True)

if __name__ == "__main__":
    main()
