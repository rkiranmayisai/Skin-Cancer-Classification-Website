"""
Skin Cancer Classification - Server Launcher
Checks dependencies, generates demo samples, and starts the FastAPI server on port 8001.
"""

import os
import sys


def check_dependencies():
    print("Checking dependencies...")
    required = ["fastapi", "uvicorn", "cv2", "numpy", "PIL"]
    missing = []
    for lib in required:
        try:
            if lib == "cv2":
                import cv2
            elif lib == "PIL":
                import PIL
            else:
                __import__(lib)
        except ImportError:
            missing.append(lib)

    if missing:
        print(f"\n[ERROR] Missing packages: {missing}")
        print("Install with: python -m pip install fastapi uvicorn opencv-python numpy pillow")
        sys.exit(1)
    print("[OK] All dependencies are available.")


def ensure_samples():
    project_root = os.path.dirname(os.path.abspath(__file__))
    samples_dir = os.path.join(project_root, "samples")
    os.makedirs(samples_dir, exist_ok=True)
    files = [f for f in os.listdir(samples_dir) if f.endswith(".jpg")]

    if len(files) < 4:
        print("Samples directory is incomplete. Generating demo images...")
        try:
            sys.path.insert(0, project_root)
            from backend.generate_samples import generate_all_samples
            generate_all_samples(samples_dir)
        except Exception as e:
            print(f"[WARN] Could not generate samples: {e}")
    else:
        print(f"[OK] Found {len(files)} sample images.")


if __name__ == "__main__":
    check_dependencies()
    ensure_samples()

    print("\n" + "-" * 60)
    print("  DermAI -- Skin Cancer Classification Platform")
    print("  Navigate to: http://127.0.0.1:8001")
    print("  Press Ctrl+C to stop the server.")
    print("-" * 60 + "\n")

    try:
        import uvicorn
        uvicorn.run("backend.app:app", host="127.0.0.1", port=8001, reload=True)
    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)
