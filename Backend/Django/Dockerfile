FROM python:3.10

WORKDIR /Django

# Install system dependencies
COPY requirements.txt .

RUN pip install -r requirements.txt

# Copy the Django project files
COPY . .

# Expose the port that Django will run on
EXPOSE 8000

# Command to run the Django development server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]