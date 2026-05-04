FROM python:3.10

WORKDIR /FastAPI

# Install system dependencies
COPY requirements.txt .

RUN pip install -r requirements.txt

# Copy the FastAPI project files
COPY . .

# Expose the port that FastAPI will run on
EXPOSE 8001

# Command to run the FastAPI development server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]