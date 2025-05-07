FROM python:3.9

# Set working directory
WORKDIR /app

# Copy your script and requirements
COPY main.py .
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Run the script
CMD ["python", "main.py"]
