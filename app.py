from flask import Flask, render_template, request, jsonify
import subprocess
import os
import sys

app = Flask(__name__)

# المجلد الذي ستعمل فيه الأدوات وتنشئ فيه ملفاتها
WORKING_DIR = os.path.join(os.getcwd(), "sandbox")
if not os.path.exists(WORKING_DIR):
    os.makedirs(WORKING_DIR)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run', methods=['POST'])
def run_code():
    data = request.json
    code = data.get('code', '')
    
    # حفظ الكود في ملف main.py داخل Sandbox
    file_path = os.path.join(WORKING_DIR, "main.py")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)
    
    try:
        # تشغيل الكود وجلب المخرجات
        process = subprocess.run(
            [sys.executable, "main.py"],
            cwd=WORKING_DIR,
            capture_output=True,
            text=True,
            timeout=15
        )
        
        output = process.stdout
        if process.stderr:
            output += "\n[ERROR]:\n" + process.stderr
            
        return jsonify({"output": output or "--- تم التنفيذ بنجاح (بدون مخرجات نصية) ---"})
    
    except subprocess.TimeoutExpired:
        return jsonify({"output": "خطأ: تجاوز الكود الوقت المحدد (15 ثانية)"})
    except Exception as e:
        return jsonify({"output": f"خطأ في النظام: {str(e)}"})

if __name__ == '__main__':
    print("السيرفر يعمل على: http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
