#!/bin/bash

# Wait a bit for mongod nodes to start (adjust sleep time as needed)
# A more robust solution would loop and check mongo connectivity
echo "Waiting for MongoDB nodes to start..."
sleep 15

# Configuration for the replica set
# Replace hostnames with your service names in docker-compose.yml
REPLICA_SET_CONFIG=$(cat <<EOF
{
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27017" },
    { _id: 2, host: "mongo3:27017" }
  ]
}
EOF
)

echo "Attempting to initiate MongoDB Replica Set..."
# Use mongosh (newer) if available, fallback to mongo (older)
if command -v mongosh &> /dev/null; then
  mongosh --host mongo1:27017 --eval "rs.initiate($REPLICA_SET_CONFIG)"
elif command -v mongo &> /dev/null; then
  mongo --host mongo1:27017 --eval "rs.initiate($REPLICA_SET_CONFIG)"
else
  echo "Error: Neither mongosh nor mongo client found in the image."
  exit 1
fi

INITIATE_STATUS=$?

if [ $INITIATE_STATUS -ne 0 ]; then
  echo "Replica Set initiation failed or may already be initialized. Status code: $INITIATE_STATUS"
  # Optionally check if already initialized: mongo --host mongo1:27017 --eval "rs.status()"
  exit $INITIATE_STATUS
else
  echo "MongoDB Replica Set initiated successfully (or possibly already initialized)."
fi


exit 0