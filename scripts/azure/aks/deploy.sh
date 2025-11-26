#!/bin/bash

# Azure AKS Deployment Script for Newborn Nest App

set -e

# Variables - Update these
RESOURCE_GROUP="newborn-nest-rg"
LOCATION="eastus"
AKS_CLUSTER_NAME="newborn-nest-aks"
ACR_NAME="newbornnestacr"
NODE_COUNT=2
NODE_SIZE="Standard_D2s_v3"

echo "🚀 Starting Azure AKS deployment..."

# 1. Create Resource Group
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# 2. Create Azure Container Registry
echo "🐳 Creating Azure Container Registry..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --location $LOCATION

# 3. Create AKS Cluster
echo "☸️ Creating AKS cluster..."
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_CLUSTER_NAME \
  --node-count $NODE_COUNT \
  --node-vm-size $NODE_SIZE \
  --enable-addons monitoring \
  --generate-ssh-keys \
  --attach-acr $ACR_NAME \
  --location $LOCATION

# 4. Get AKS credentials
echo "🔑 Getting AKS credentials..."
az aks get-credentials \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_CLUSTER_NAME \
  --overwrite-existing

# 5. Build and push Docker images
echo "🏗️ Building and pushing Docker images..."
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer --output tsv)

# Login to ACR
az acr login --name $ACR_NAME

# Build backend
docker build -f ../../docker/Dockerfile.backend -t $ACR_LOGIN_SERVER/newborn-nest-backend:latest ../../../
docker push $ACR_LOGIN_SERVER/newborn-nest-backend:latest

# Build frontend
docker build -f ../../docker/Dockerfile.frontend -t $ACR_LOGIN_SERVER/newborn-nest-frontend:latest ../../../
docker push $ACR_LOGIN_SERVER/newborn-nest-frontend:latest

# 6. Update Kubernetes manifests with ACR image URLs
echo "📝 Updating Kubernetes manifests..."
sed -i "s|<YOUR_REGISTRY>|$ACR_LOGIN_SERVER|g" ../../kubernetes/*.yaml

# 7. Deploy to AKS
echo "🚢 Deploying to AKS..."
kubectl apply -f ../../kubernetes/namespace.yaml
kubectl apply -f ../../kubernetes/configmap.yaml
kubectl apply -f ../../kubernetes/secrets.yaml
kubectl apply -f ../../kubernetes/persistent-volumes.yaml
kubectl apply -f ../../kubernetes/backend-deployment.yaml
kubectl apply -f ../../kubernetes/backend-service.yaml
kubectl apply -f ../../kubernetes/frontend-deployment.yaml
kubectl apply -f ../../kubernetes/frontend-service.yaml

# 8. Wait for deployment
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/newborn-nest-backend -n newborn-nest
kubectl wait --for=condition=available --timeout=300s deployment/newborn-nest-frontend -n newborn-nest

# 9. Get external IP
echo "🌐 Getting external IP..."
kubectl get service frontend -n newborn-nest

echo "✅ Deployment complete!"
echo "Run 'kubectl get all -n newborn-nest' to see all resources"
