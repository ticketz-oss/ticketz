#!/bin/bash

INPUT_DIR=$1
ARCHIVE_NAME="retrieved_data.tar.gz" # Name of the tar.gz file

if [ -n "$2" ] ; then
  . $2
fi

# Check the input file exists
if [ ! -f "$INPUT_DIR/$ARCHIVE_NAME" ]; then
    exit 0
fi

echo "Retrieve file found"

# Decompress the tar.gz file to get the CSV files
echo "Decompressing tar.gz archive..."
tar -xzf "$INPUT_DIR/$ARCHIVE_NAME" -C "$INPUT_DIR"

# Check if the decompression was successful
if [[ $? -ne 0 ]]; then
    echo "Error decompressing archive."
    exit 100
fi

# Check if all tables are empty
for input_file in "$INPUT_DIR"/*.csv; do
    # Get the table name from the CSV file name, ignoring the prefix
    table=$(basename "$input_file" .csv | cut -d'-' -f2-)
    if [[ $(PGPASSWORD="${DB_PASS}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT 1 FROM \"$table\" LIMIT 1") ]]; then
        echo "Table '$table' is not empty. Will not load retrieved file"
        exit 100
    fi
done

export PGPASSWORD="${DB_PASS}"

# Loop over each CSV file and generate \COPY command for each
for input_file in "$INPUT_DIR"/*.csv; do
    # Get the table name from the CSV file name, ignoring the prefix
    table=$(basename "$input_file" .csv | cut -d'-' -f2-)

    # Read the first line of the CSV file
    IFS=',' read -r -a columns < "$input_file"

    # Add quotes around each column name
    columnList=""
    first="1"
    for column in "${columns[@]}"; do
        if [ -z "${first}" ] ; then
            columnList+=", "
        else
            first=""
        fi
        columnList+="\"$column\""
    done

    # Generate the \COPY command to import the CSV file into the table
    echo "Importing data from '$input_file'"
    psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -c "\COPY \"$table\"(${columnList}) FROM '$input_file' WITH CSV HEADER" &> "${input_file}.log"

    if [ $? -gt 0 ]; then
        echo "Error importing $input_file:"
        cat "${input_file}.log"
        exit 100
    fi

    # Check if the import was successful
    if [[ $? -eq 0 ]]; then
        echo "Data imported successfully from $input_file into table '$table'."
    else
        echo "Error importing data from $input_file into table '$table'."
    fi
done

echo "Clearing Whatsapp Sessions"
psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -c "UPDATE \"Whatsapps\" SET session='', status='DISCONNECTED'" &> /tmp/clearwhatsapps.log

if [ $? -gt 0 ]; then
    echo "Error clearing Whatsapp sessions:"
    cat /tmp/clearwhatsapps.log
    exit 100
fi

echo "Fixing sequences"
cat ./scripts/fix-sequence.sql | psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" &> /tmp/fixsequences.log

if [ $? -gt 0 ]; then
    echo "Error fixing sequences:"
    cat /tmp/fixsequences.log
    exit 100
fi

exit 1
