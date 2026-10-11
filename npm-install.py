import os
import subprocess

# Set the root directory to start from
root_dir = os.getcwd()  # You can change this to any path

for subdir, dirs, files in os.walk(root_dir):
    if 'package.json' in files:
        print(f"Found package.json in {subdir}. Running npm install...")
        subprocess.run([r'C:\Users\mrkee\AppData\Roaming\npm\node_modules\npm', 'install'], cwd=subdir)
