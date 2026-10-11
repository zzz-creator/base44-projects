import os
import json
import logging
import tkinter as tk
from tkinter import filedialog, messagebox

# ---------------- Logging Setup ----------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# ---------------- Core Function ----------------
def save_object_to_file(obj, base_directory):
    try:
        for key, value in obj.items():

            # Split key into path components
            path_parts = key.split('/')
            file_name = path_parts[-1]

            # Build folder path
            if len(path_parts) > 1:
                parent_folder = os.path.join(base_directory, *path_parts[:-1])
                os.makedirs(parent_folder, exist_ok=True)
            else:
                parent_folder = base_directory

            # Full file path
            file_path = os.path.join(parent_folder, file_name)

            # Write file
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(str(value))

            logging.info(f"Saved value to {file_path}")

    except Exception as e:
        logging.error(f"Error saving files: {e}")
        messagebox.showerror("Error", str(e))

# ---------------- File Choosers ----------------
def choose_json_file():
    return filedialog.askopenfilename(
        title="Select JSON File",
        filetypes=[("JSON Files", "*.json")]
    )

def choose_save_directory():
    return filedialog.askdirectory(
        title="Select Save Directory"
    )

# ---------------- Main Workflow ----------------
def main():
    root = tk.Tk()
    root.withdraw()  # Hide main window

    # Choose JSON file
    json_path = choose_json_file()
    if not json_path:
        logging.warning("No JSON file selected.")
        return

    # Load JSON object
    try:
        with open(json_path, 'r', encoding='utf-8') as file:
            example_object = json.load(file)
        logging.info("JSON file loaded successfully.")
    except Exception as e:
        logging.error(f"Failed to load JSON file: {e}")
        messagebox.showerror("JSON Load Error", str(e))
        return

    # Choose save directory
    save_directory = choose_save_directory()
    if not save_directory:
        logging.warning("No save directory selected.")
        return

    # Save files
    save_object_to_file(example_object, save_directory)
    messagebox.showinfo("Success", "Files saved successfully!")

# ---------------- Run ----------------
if __name__ == "__main__":
    main()
