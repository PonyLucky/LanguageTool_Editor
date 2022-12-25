import os
from flask import Flask, send_from_directory

app = Flask(__name__, static_folder='public')

# Serve the index.html file from the root path
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# Serve static files from the 'public' directory
@app.route('/<path:path>')
def static_file(path):
    return send_from_directory('public', path)

# 404 handler to serve the index.html file
@app.errorhandler(404)
def page_not_found(e):
    return send_from_directory('.', 'index.html')


def override_env_js():
    with open('public/env.js', 'w') as f:
        f.write('window.env = {')
        for key, value in os.environ.items():
            f.write('"%s": "%s",' % (key, value))
        f.write('};')

if __name__ == '__main__':
    # Override file 'env.js' with environment variables
    override_env_js()
    # Run the app on port 80
    app.run(host='0.0.0.0', port=80)
