import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

app = Flask(__name__)
CORS(app)

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'db'),
    'database': os.getenv('DB_NAME', 'logs_db'),
    'user': os.getenv('DB_USER', 'logs_user'),
    'password': os.getenv('DB_PASSWORD', 'logs_password'),
    'port': os.getenv('DB_PORT', 5432)
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)

@app.route('/health')
def health():
    return jsonify({"status": "ok", "database": "connected", "timestamp": datetime.now().isoformat()})

@app.route('/logs', methods=['GET'])
def get_logs():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100')
    logs = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify({"logs": logs})

@app.route('/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*) as total FROM logs')
    total = cur.fetchone()['total']
    cur.close()
    conn.close()
    return jsonify({"total_logs": total, "levels": {"error": 0, "warning": 0}})

@app.route('/logs', methods=['POST'])
def add_log():
    data = request.json
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('INSERT INTO logs (level, message, service) VALUES (%s, %s, %s)',
                (data.get('level', 'info'), data.get('message', ''), data.get('service', 'unknown')))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"success": True}), 201
