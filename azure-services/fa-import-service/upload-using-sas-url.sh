#!/bin/bash

PATH_TO_FILE=$1
SAS_URL=$2
STORAGE_ACCOUNT=devstoreaccount1

if [[ -z "$PATH_TO_FILE" || -z "$SAS_URL" ]]; then
  echo "Error: PATH_TO_FILE and SAS_URL are required."
  echo "Usage: $0 <PATH_TO_FILE> <SAS_URL>"
  exit 1
fi

# Get the current date in GMT format for the x-ms-date header
DATE=$(TZ=GMT date "+%a, %d %b %Y %H:%M:%S %Z")

# Execute the curl command with all required headers
curl --location --request PUT "$SAS_URL" \
  -H "x-ms-version: 2019-12-12" \
  -H "x-ms-date: ${DATE}" \
  -H "x-ms-blob-type: BlockBlob" \
  -H "Content-Type: text/csv" \
  --data-binary @"${PATH_TO_FILE}"
