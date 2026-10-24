"""
Local development runner for WorkshopHub.
Run: python run.py
"""
import sys
import os

# Add the project root to path so Flask can find templates/static
sys.path.insert(0, os.path.dirname(__file__))

# Load environment variables from .env if present
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
except ImportError:
    pass

from api.index import app

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False, host='127.0.0.1', port=5000)
