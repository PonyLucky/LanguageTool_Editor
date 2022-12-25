# docker run -e API_URL=http://192.168.1.105:8011 -p 80:80 languagetooleditor
FROM python:3

# Install the required Python libraries
RUN pip install flask

# Set the working directory to the root of the project
WORKDIR /app

# Copy the project files to the appropriate directory in the image
COPY public /app/public
# Copy index.html to the root of the project
COPY index.html /app/index.html
# Copy the Python script to the root of the project
COPY main.py /app/main.py

# Expose port 5000 for incoming HTTP traffic
EXPOSE 5000

# Run the Flask web server when the container starts
CMD ["python", "main.py"]
