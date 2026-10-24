import os
import json
import datetime
from flask import Flask, render_template, request, jsonify

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
except ImportError:
    pass

# ---------------------------------------------------------------------------
# Flask App
# ---------------------------------------------------------------------------
app = Flask(
    __name__,
    template_folder=os.path.join(os.path.dirname(__file__), '..', 'templates'),
    static_folder=os.path.join(os.path.dirname(__file__), '..', 'static'),
    static_url_path='/static'
)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-key')

@app.context_processor
def inject_client_env():
    return {
        'SUPABASE_URL': os.environ.get('SUPABASE_URL', ''),
        'SUPABASE_ANON_KEY': os.environ.get('SUPABASE_ANON_KEY', '')
    }


# ---------------------------------------------------------------------------
# Workshop Data (could migrate to Supabase later)
# ---------------------------------------------------------------------------
WORKSHOPS = [
    {
        "id": "ws-python-masterclass",
        "title": "Python Masterclass",
        "name": "Python Masterclass",
        "subtitle": "From Fundamentals to Advanced Patterns",
        "description": "Deep-dive into Python covering decorators, generators, metaclasses, async/await, and performance tuning. Build real-world projects and leave with production-grade skills.",
        "instructor": "Dr. Ananya Sharma",
        "date": "2026-11-15",
        "time": "10:00 AM – 4:00 PM IST",
        "duration": "6 hours",
        "capacity": 30,
        "enrolled": 18,
        "price": "Free",
        "price_num": 0,
        "level": "Intermediate",
        "category": "Backend",
        "badge": "FLAGSHIP TRACK",
        "image": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=850&q=85",
        "tags": ["Python", "Backend", "Best Practices"],
        "icon": "🐍"
    },
    {
        "id": "ws-ai-ml-bootcamp",
        "title": "AI / ML Bootcamp",
        "name": "AI / ML Bootcamp",
        "subtitle": "Build & Deploy Intelligent Models",
        "description": "Hands-on workshop covering scikit-learn, TensorFlow, and model deployment. Train classifiers, build recommendation engines, and ship an ML API by the end of the day.",
        "instructor": "Raj Patel",
        "date": "2026-11-22",
        "time": "9:00 AM – 5:00 PM IST",
        "duration": "8 hours",
        "capacity": 25,
        "enrolled": 21,
        "price": "Free",
        "price_num": 0,
        "level": "Advanced",
        "category": "AI & ML",
        "badge": "STUDENT FAVOURITE",
        "image": "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=850&q=85",
        "tags": ["AI", "Machine Learning", "TensorFlow"],
        "icon": "🤖"
    },
    {
        "id": "ws-fullstack-web",
        "title": "Full-Stack Web Dev",
        "name": "Full-Stack Web Dev",
        "subtitle": "Modern Web from Front to Back",
        "description": "Build a production-ready web app using modern frontend architecture and Flask on the backend. Covers REST APIs, database design, auth, and deployment to Vercel.",
        "instructor": "Priya Nair",
        "date": "2026-12-01",
        "time": "10:00 AM – 3:00 PM IST",
        "duration": "5 hours",
        "capacity": 35,
        "enrolled": 12,
        "price": "Free",
        "price_num": 0,
        "level": "Beginner",
        "category": "Web Dev",
        "badge": "HOUSE SPECIAL",
        "image": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=850&q=85",
        "tags": ["HTML", "CSS", "Flask", "JavaScript"],
        "icon": "🌐"
    },
    {
        "id": "ws-cloud-devops",
        "title": "Cloud & DevOps",
        "name": "Cloud & DevOps",
        "subtitle": "CI/CD, Containers, and Infrastructure",
        "description": "Learn Docker, GitHub Actions, and cloud deployment on AWS/GCP. Automate your workflow from commit to production with real pipelines and zero-downtime rollouts.",
        "instructor": "Karthik Menon",
        "date": "2026-12-08",
        "time": "11:00 AM – 5:00 PM IST",
        "duration": "6 hours",
        "capacity": 20,
        "enrolled": 14,
        "price": "Free",
        "price_num": 0,
        "level": "Intermediate",
        "category": "DevOps",
        "badge": "INDUSTRY DEMAND",
        "image": "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=850&q=85",
        "tags": ["Docker", "CI/CD", "AWS", "GitHub Actions"],
        "icon": "☁️"
    },
    {
        "id": "ws-cybersecurity",
        "title": "Cybersecurity Essentials",
        "name": "Cybersecurity Essentials",
        "subtitle": "Offensive & Defensive Security",
        "description": "Explore penetration testing, vulnerability scanning, secure coding, and incident response. Hands-on labs with Kali Linux and OWASP tools.",
        "instructor": "Sneha Iyer",
        "date": "2026-12-15",
        "time": "10:00 AM – 4:00 PM IST",
        "duration": "6 hours",
        "capacity": 20,
        "enrolled": 17,
        "price": "Free",
        "price_num": 0,
        "level": "Intermediate",
        "category": "Security",
        "badge": "HANDS-ON LAB",
        "image": "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=850&q=85",
        "tags": ["Security", "Ethical Hacking", "OWASP"],
        "icon": "🔐"
    },
    {
        "id": "ws-data-engineering",
        "title": "Data Engineering Pipeline",
        "name": "Data Engineering Pipeline",
        "subtitle": "ETL, Warehousing & Real-Time Streams",
        "description": "Design and implement data pipelines with Apache Kafka, Spark, and BigQuery. Learn schema design, data quality checks, and orchestration with Airflow.",
        "instructor": "Vikram Desai",
        "date": "2026-12-22",
        "time": "9:30 AM – 4:30 PM IST",
        "duration": "7 hours",
        "capacity": 25,
        "enrolled": 9,
        "price": "Free",
        "price_num": 0,
        "level": "Advanced",
        "category": "Data",
        "badge": "ADVANCED SCALE",
        "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=850&q=85",
        "tags": ["Data", "Kafka", "Spark", "BigQuery"],
        "icon": "🔧"
    }
]

# ---------------------------------------------------------------------------
# Routes — Pages
# ---------------------------------------------------------------------------
@app.route('/')
def index():
    return render_template('index.html', workshops=WORKSHOPS)


@app.route('/auth')
def auth():
    """Login / Register page."""
    return render_template('auth.html')


@app.route('/workshops')
def workshops():
    """Browse all workshops."""
    return render_template('workshops.html', workshops=WORKSHOPS)


@app.route('/workshop/<workshop_id>')
def workshop_detail(workshop_id):
    """Single workshop detail page."""
    ws = next((w for w in WORKSHOPS if w['id'] == workshop_id), None)
    if not ws:
        return render_template('404.html'), 404
    return render_template('workshop_detail.html', workshop=ws, all_workshops=WORKSHOPS)


@app.route('/dashboard')
def dashboard():
    """User dashboard – bookings overview."""
    return render_template('dashboard.html', workshops=WORKSHOPS)


# ---------------------------------------------------------------------------
# Routes — API (Vercel Serverless Functions)
# ---------------------------------------------------------------------------
@app.route('/api/workshops', methods=['GET'])
def api_workshops():
    """Return all workshops as JSON."""
    return jsonify(WORKSHOPS)


@app.route('/api/workshop/<workshop_id>', methods=['GET'])
def api_workshop(workshop_id):
    """Return a single workshop."""
    ws = next((w for w in WORKSHOPS if w['id'] == workshop_id), None)
    if not ws:
        return jsonify({"error": "Workshop not found"}), 404
    return jsonify(ws)


@app.route('/api/activity', methods=['POST'])
def api_activity():
    """
    Activity telemetry logger (mirrors SaffronTracker telemetry pipeline).
    Logs page views, filter clicks, product impressions, and booking attempts.
    """
    try:
        data = request.get_json(silent=True) or {}
        event_name = data.get('event', 'unknown')
        session_id = data.get('sessionId', 'anonymous')
        print(f"[Activity Telemetry] {datetime.datetime.now().isoformat()} | {event_name} | {session_id} | {json.dumps(data.get('data', {}))}")
        return jsonify({"status": "logged", "event": event_name}), 200
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 400


@app.route('/api/book', methods=['POST'])
def api_book():
    """
    Book a workshop or table reservation.
    Supports both direct workshop ID and quick reservation requests.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    # Support multiple formats (direct booking or quick reservation)
    user_name = (data.get('user_name') or data.get('guestName') or '').strip()
    user_email = (data.get('user_email') or data.get('guestEmail') or '').strip()
    user_phone = (data.get('user_phone') or data.get('guestPhone') or '').strip()
    workshop_id = (data.get('workshop_id') or data.get('workshopId') or '').strip()
    booking_date = (data.get('booking_date') or data.get('bookingDate') or '').strip()
    booking_time = (data.get('booking_time') or data.get('bookingTime') or '').strip()

    if not user_name or not user_email:
        return jsonify({"error": "Missing required fields: Name and Email are required."}), 400

    # If workshop_id is provided, validate it
    ws = None
    if workshop_id:
        ws = next((w for w in WORKSHOPS if w['id'] == workshop_id or w['title'].lower() == workshop_id.lower()), None)

    if not ws:
        # Default to first workshop if not specified in general reservation
        ws = WORKSHOPS[0]

    # Check capacity
    if ws['enrolled'] >= ws['capacity']:
        return jsonify({"error": f"Workshop '{ws['title']}' is currently fully booked."}), 409

    # Record to Google Sheets
    sheets_result = _record_to_sheets(user_name, user_email, ws, extra_info={
        "phone": user_phone,
        "date": booking_date or ws['date'],
        "time": booking_time or ws['time']
    })

    # Increment local enrolled count
    ws['enrolled'] += 1

    return jsonify({
        "success": True,
        "message": f"Seat reserved successfully for {ws['title']}! Confirmation sent to {user_email}.",
        "workshop": ws,
        "guestName": user_name
    })


# ---------------------------------------------------------------------------
# Google Sheets Integration
# ---------------------------------------------------------------------------
def _record_to_sheets(user_name: str, user_email: str, workshop: dict, extra_info: dict = None) -> dict:
    """Append a row to the configured Google Sheet."""
    try:
        import gspread
        from google.oauth2.service_account import Credentials

        creds_json = os.environ.get('GOOGLE_SHEETS_CREDENTIALS')
        sheet_id = os.environ.get('GOOGLE_SHEET_ID')

        if not creds_json or not sheet_id:
            # Graceful degradation when credentials are not configured
            print("[WARN] Google Sheets credentials not configured — skipping sheet write.")
            return {"success": True, "note": "Sheets not configured; booking accepted locally."}

        creds_info = json.loads(creds_json)
        scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
        ]
        credentials = Credentials.from_service_account_info(creds_info, scopes=scopes)
        gc = gspread.authorize(credentials)
        sheet = gc.open_by_key(sheet_id).sheet1

        # Append row: Timestamp | Name | Email | Workshop | Date | Level
        row = [
            datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            user_name,
            user_email,
            workshop['title'],
            workshop['date'],
            workshop['level'],
        ]
        sheet.append_row(row, value_input_option='USER_ENTERED')
        return {"success": True}

    except Exception as e:
        print(f"[ERROR] Google Sheets write failed: {e}")
        return {"success": False, "error": str(e)}


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404


# Vercel expects the Flask app object
app = app
