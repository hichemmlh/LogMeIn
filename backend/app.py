import os, psycopg2, time
from flask import Flask, jsonify, request
from flask_cors import CORS
from psycopg2.extras import RealDictCursor

app = Flask(__name__)
CORS(app)

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'db'),
    'database': os.getenv('DB_NAME', 'logs_db'),
    'user': os.getenv('DB_USER', 'logs_user'),
    'password': os.getenv('DB_PASSWORD', 'logs_password')
}

def get_db_connection():
    while True:
        try:
            return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        except:
            time.sleep(2)

@app.route('/health')
def health(): return jsonify({"status": "ok"})

@app.route('/logs', methods=['GET'])
def get_logs():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100')
    logs = cur.fetchall()
    cur.close() ; conn.close()
    return jsonify({"logs": logs})

@app.route('/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*) as total FROM logs')
    total = cur.fetchone()['total']
    cur.execute("SELECT COUNT(*) as errors FROM logs WHERE level='error'")
    errors = cur.fetchone()['errors']
    cur.execute("SELECT COUNT(*) as warnings FROM logs WHERE level='warning'")
    warnings = cur.fetchone()['warnings']
    cur.execute("SELECT MAX(timestamp) as last FROM logs")
    last = cur.fetchone()['last']
    cur.close() ; conn.close()
    return jsonify({
        "total_logs": total, 
        "levels": {"error": errors, "warning": warnings},
        "last_log": last.isoformat() if last else None
    })

@app.route('/logs', methods=['POST'])
def add_log():
    data = request.json
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('INSERT INTO logs (level, message, service) VALUES (%s, %s, %s)',
                (data.get('level', 'info'), data.get('message', ''), data.get('service', 'web')))
    conn.commit()
    cur.close() ; conn.close()
    return jsonify({"success": True}), 201

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
