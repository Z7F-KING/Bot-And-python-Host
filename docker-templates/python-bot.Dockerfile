FROM python:3.10-slim

WORKDIR /app

# تثبيت discord.py و أي مكتبات إضافية
RUN pip install discord.py python-dotenv

# نسخ الكود
COPY main.py .

# تشغيل البوت
CMD ["python", "main.py"]
