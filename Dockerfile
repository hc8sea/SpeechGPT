# Set the base image 
#FROM python:3.8-slim-buster
FROM python:3.10-slim

# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED True

# Copy local code to the container image.
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY . ./

# Set the working directory
#WORKDIR /app

# Copy the requirements file
COPY requirements.txt .

# Install the requirements
RUN apt-get update && apt-get install -y ffmpeg && apt install -y git

RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
#COPY . .

# Copy static files (JavaScript, CSS, etc.) to the appropriate directory
#COPY static/ /app/static/

# Expose port 8080
#EXPOSE 8080

# Set the command to start the server
#CMD [ "python", "app.py" ]
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 main:app









