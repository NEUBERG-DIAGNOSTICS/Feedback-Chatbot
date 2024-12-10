import pyodbc
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Flask application setup
app = Flask(__name__)
CORS(app)

# MS SQL Server connection details from environment variables
SERVER = os.getenv('DB_SERVER')       # Example: 10.100.6.38
DATABASE = os.getenv('DB_DATABASE')  # Example: feed
USERNAME = os.getenv('DB_USERNAME')  # Example: testbk
PASSWORD = os.getenv('DB_PASSWORD')  # Example: test.py

# Connect to MS SQL Server
def get_db_connection():
    try:
        conn = pyodbc.connect(
            'DRIVER={ODBC Driver 17 for SQL Server};'
            f'SERVER={SERVER};'
            f'DATABASE={DATABASE};'
            f'UID={USERNAME};'
            f'PWD={PASSWORD}'
        )
        return conn
    except pyodbc.Error as e:
        print(f"Database connection failed: {e}")
        return None

# Initialize database with the updated schema
def init_db():
    conn = get_db_connection()
    if conn is None:
        print("Error: Unable to connect to the database for initialization.")
        return

    cursor = conn.cursor()
    try:
        cursor.execute('''
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'feedback')
            CREATE TABLE feedback (
                id INT IDENTITY(1,1) PRIMARY KEY,
                rating NVARCHAR(50),
                appointment_booking INT DEFAULT 0,
                punctuality INT DEFAULT 0,
                sample_collection INT DEFAULT 0,
                other INT DEFAULT 0,
                other_feedback NVARCHAR(MAX)
            )
        ''')
        conn.commit()
    except pyodbc.Error as e:
        print(f"Error initializing database: {e}")
    finally:
        conn.close()

@app.route('/submit_feedback', methods=['POST'])
def submit_feedback():
    data = request.json
    if not data:
        return jsonify({"error": "Invalid input"}), 400

    # Extract feedback data
    rating = data.get('rating')
    feedback_options = data.get('feedback_options', [])
    other_feedback = data.get('other_feedback', '')

    # Validate required fields
    if not rating or not isinstance(feedback_options, list):
        return jsonify({"error": "Invalid or missing feedback data"}), 400

    # Determine column values
    appointment_booking = 1 if 'Appointment Booking' in feedback_options else 0
    punctuality = 1 if 'Punctuality' in feedback_options else 0
    sample_collection = 1 if 'Sample Collection' in feedback_options else 0
    other = 1 if 'Other' in feedback_options else 0

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO feedback (rating, appointment_booking, punctuality, sample_collection, other, other_feedback)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (rating, appointment_booking, punctuality, sample_collection, other, other_feedback))
        conn.commit()
        return jsonify({"message": "Feedback submitted successfully"}), 200
    except pyodbc.Error as e:
        print(f"Error inserting data: {e}")
        return jsonify({"error": "Failed to submit feedback"}), 500
    finally:
        conn.close()

@app.route('/')
def index():
    return "Welcome to the Feedback Chatbot Backend API!"

if __name__ == '__main__':
    init_db()
    app.run(debug=True)