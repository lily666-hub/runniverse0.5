FROM python:3.10-slim

WORKDIR /home/user/app

COPY dist/ ./dist/
COPY app.py .

EXPOSE 7860

CMD ["python", "-u", "app.py"]
