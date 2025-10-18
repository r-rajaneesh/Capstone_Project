#!/bin/bash

# A script to convert all .docx and .pptx files in the current directory to PDF.

# Check if LibreOffice is installed.
if ! command -v libreoffice &> /dev/null; then
    echo "Error: libreoffice is not installed."
    echo "Please install it using: sudo apt install libreoffice"
    exit 1
fi

# Counter for converted files.
count=0

# Find and convert all .docx and .pptx files.
for file in *.docx *.pptx; do
    # Check if the file actually exists to handle cases where no files of a type are found.
    if [ -f "$file" ]; then
        echo "Converting '$file'..."
        libreoffice --headless --convert-to pdf "$file"
        ((count++))
    fi
done

if [ "$count" -eq 0 ]; then
    echo "No .docx or .pptx files found to convert."
else
    echo "-------------------------------------"
    echo "✅ Conversion complete. $count file(s) converted."
fi
