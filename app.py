from flask import Flask, render_template, request, jsonify
import subprocess
import os

app = Flask(__name__)
BASE_DIR = os.path.join(os.getcwd(), "uploads")

if not os.path.exists(BASE_DIR):
    os.makedirs(BASE_DIR)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run', methods=['POST'])
def run_code():
    code = request.json.get('code')
    # حفظ الكود في ملف مؤقت لتشغيله
    file_path = os.path.join(BASE_DIR, "main.py")
    with open(file_path, "w") as f:
        f.write(code)
    
    try:
        # تشغيل الكود والتقاط المخرجات
        result = subprocess.run(['python3', file_path], 
                                cwd=BASE_DIR, 
                                capture_output=True, 
                                text=True, 
                                timeout=10)
        output = result.stdout if result.stdout else result.stderr
    except Exception as e:
        output = str(e)
    
    return jsonify({"output": output})

if __name__ == '__main__':
    app.run(debug=True)
