from flask import Flask, render_template, request, jsonify
import subprocess
import os
import sys

app = Flask(__name__)
# المجلد الذي ستعمل فيه الأدوات
SANDBOX = os.path.join(os.getcwd(), "sandbox")
if not os.path.exists(SANDBOX): os.makedirs(SANDBOX)

@app.route('/')
def index(): return render_template('index.html')

@app.route('/run', methods=['POST'])
def run_code():
    code = request.json.get('code', '')
    with open(os.path.join(SANDBOX, "main.py"), "w", encoding="utf-8") as f:
        f.write(code)
    try:
        process = subprocess.run([sys.executable, "main.py"], cwd=SANDBOX, capture_output=True, text=True, timeout=10)
        output = process.stdout + (process.stderr if process.stderr else "")
        # جلب قائمة الملفات بعد التشغيل
        files = os.listdir(SANDBOX)
        return jsonify({"output": output or "Done.", "files": files})
    except Exception as e:
        return jsonify({"output": str(e), "files": []})

@app.route('/get_files', methods=['GET'])
def get_files():
    files = os.listdir(SANDBOX)
    return jsonify({"files": files})

if __name__ == '__main__':
    app.run(debug=True)
