#!/bin/bash

API_URL="http://localhost:5000/api/timeline_post"

RANDOM_NUM=$RANDOM

NAME="Jessica Test $RANDOM_NUM"
EMAIL="test${RANDOM_NUM}@example.com"
CONTENT="Automated test $RANDOM_NUM"

echo "Creating timeline post..."

POST_RESPONSE=$(curl --silent \
    --request POST \
    "$API_URL" \
    --data-urlencode "name=$NAME" \
    --data-urlencode "email=$EMAIL" \
    --data-urlencode "content=$CONTENT")

echo "$POST_RESPONSE"

echo
echo "Checking GET endpoint..."

GET_RESPONSE=$(curl --silent "$API_URL")

echo "$GET_RESPONSE"

echo
echo "Verifying timeline post..."

if echo "$GET_RESPONSE" | grep -q "$CONTENT"; then
    echo "PASS"
else
    echo "FAIL"
    exit 1
fi
