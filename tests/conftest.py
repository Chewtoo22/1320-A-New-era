import sys
from pathlib import Path

# Add the backend directory to the Python path so backend modules can be imported
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))
