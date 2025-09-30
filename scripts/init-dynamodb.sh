#!/bin/bash

# Create Users table with GSI for username lookup
aws dynamodb create-table \
    --table-name Users \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=username,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        "[{\"IndexName\": \"UsernameIndex\",\"KeySchema\":[{\"AttributeName\":\"username\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}]" \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --endpoint-url http://localhost:8000

# Create Products table with GSI for link lookup
aws dynamodb create-table \
    --table-name Products \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=link,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        "[{\"IndexName\": \"LinkIndex\",\"KeySchema\":[{\"AttributeName\":\"link\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}]" \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --endpoint-url http://localhost:8000

# Create Actions table with GSI for type + created_at lookup
aws dynamodb create-table \
    --table-name Actions \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=type,AttributeType=S \
        AttributeName=created_at,AttributeType=S \
        AttributeName=is_processed,AttributeType=N \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        "[{\"IndexName\": \"TypeCreatedIndex\",\"KeySchema\":[{\"AttributeName\":\"type\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"created_at\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}]" \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --endpoint-url http://localhost:8000

# Create ActionConfigs table
aws dynamodb create-table \
    --table-name ActionConfigs \
    --attribute-definitions \
        AttributeName=action_type,AttributeType=S \
    --key-schema \
        AttributeName=action_type,KeyType=HASH \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --endpoint-url http://localhost:8000

# Insert default action configs
aws dynamodb put-item \
    --table-name ActionConfigs \
    --item '{"action_type":{"S":"ADD_PRODUCT"},"interval_minutes":{"N":"1"},"enabled":{"BOOL":true}}' \
    --endpoint-url http://localhost:8000

aws dynamodb put-item \
    --table-name ActionConfigs \
    --item '{"action_type":{"S":"CHECK_PRODUCT"},"interval_minutes":{"N":"60"},"enabled":{"BOOL":true}}' \
    --endpoint-url http://localhost:8000

aws dynamodb put-item \
    --table-name ActionConfigs \
    --item '{"action_type":{"S":"NOTIFY_PRICE"},"interval_minutes":{"N":"1"},"enabled":{"BOOL":true}}' \
    --endpoint-url http://localhost:8000