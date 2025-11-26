# Newborn Nest App - Deployment Guide

This directory contains deployment configurations for multiple cloud platforms:

- **AWS ECS** (Elastic Container Service)
- **AWS EKS** (Elastic Kubernetes Service)
- **AWS Elastic Beanstalk**
- **Azure AKS** (Azure Kubernetes Service)
- **Azure ACS** (Azure Container Service - Legacy)

## Table of Contents

1. [Docker Setup](#docker-setup)
2. [AWS ECS Deployment](#aws-ecs-deployment)
3. [AWS EKS Deployment](#aws-eks-deployment)
4. [AWS Elastic Beanstalk Deployment](#aws-elastic-beanstalk-deployment)
5. [Azure AKS Deployment](#azure-aks-deployment)
6. [Azure ACS Deployment](#azure-acs-deployment)

---

## Docker Setup

### Local Development with Docker

```bash
# Build and run with Docker Compose
cd scripts/docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Build Individual Images

```bash
# Backend
docker build -f scripts/docker/Dockerfile.backend -t newborn-nest-backend:latest .

# Frontend
docker build -f scripts/docker/Dockerfile.frontend -t newborn-nest-frontend:latest .
```

---

## AWS ECS Deployment

### Prerequisites
- AWS CLI installed and configured
- Docker installed
- ECR repositories created
- ECS cluster created
- Application Load Balancer configured

### Step 1: Push Images to ECR

```bash
# Login to ECR
aws ecr get-login-password --region <REGION> | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com

# Tag and push backend
docker tag newborn-nest-backend:latest <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/newborn-nest-backend:latest
docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/newborn-nest-backend:latest

# Tag and push frontend
docker tag newborn-nest-frontend:latest <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/newborn-nest-frontend:latest
docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/newborn-nest-frontend:latest
```

### Step 2: Register Task Definitions

```bash
cd scripts/aws/ecs

# Update placeholders in task definitions
# <ACCOUNT_ID>, <REGION>, <EFS_FILE_SYSTEM_ID>

# Register backend task definition
aws ecs register-task-definition --cli-input-json file://task-definition-backend.json

# Register frontend task definition
aws ecs register-task-definition --cli-input-json file://task-definition-frontend.json
```

### Step 3: Create Services

```bash
# Update placeholders in service files
# subnets, security groups, target group ARNs

# Create backend service
aws ecs create-service --cli-input-json file://service-backend.json

# Create frontend service
aws ecs create-service --cli-input-json file://service-frontend.json
```

### Step 4: Verify Deployment

```bash
aws ecs list-services --cluster newborn-nest-cluster
aws ecs describe-services --cluster newborn-nest-cluster --services newborn-nest-backend-service
```

---

## AWS EKS Deployment

### Prerequisites
- AWS CLI installed and configured
- kubectl installed
- eksctl installed (optional but recommended)
- ECR repositories created

### Step 1: Create EKS Cluster

```bash
eksctl create cluster \
  --name newborn-nest-cluster \
  --region <REGION> \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed
```

### Step 2: Configure kubectl

```bash
aws eks update-kubeconfig --name newborn-nest-cluster --region <REGION>
```

### Step 3: Push Images to ECR

```bash
# Same as ECS deployment (see above)
```

### Step 4: Update Kubernetes Manifests

```bash
cd scripts/kubernetes

# Update <YOUR_REGISTRY> in deployment files
sed -i "s|<YOUR_REGISTRY>|<ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com|g" *.yaml
```

### Step 5: Deploy to EKS

```bash
# Apply manifests in order
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml
kubectl apply -f persistent-volumes.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

# Optional: Apply ingress
kubectl apply -f ingress.yaml
```

### Step 6: Verify Deployment

```bash
kubectl get all -n newborn-nest
kubectl get pods -n newborn-nest -w
kubectl logs -f deployment/newborn-nest-backend -n newborn-nest
```

### Step 7: Get External IP

```bash
kubectl get service frontend -n newborn-nest
```

---

## AWS Elastic Beanstalk Deployment

### Prerequisites
- AWS CLI installed and configured
- EB CLI installed
- ECR repositories created with images pushed

### Step 1: Initialize Elastic Beanstalk

```bash
cd scripts/aws/elasticbeanstalk

# Initialize EB application
eb init -p docker newborn-nest --region <REGION>
```

### Step 2: Update Dockerrun.aws.json

Update the following placeholders:
- `<ACCOUNT_ID>`
- `<REGION>`

### Step 3: Create Environment

```bash
# Create environment
eb create newborn-nest-prod \
  --instance-type t3.medium \
  --envvars NODE_ENV=production

# Or use an existing environment
eb use newborn-nest-prod
```

### Step 4: Deploy

```bash
# Deploy application
eb deploy

# Check status
eb status
eb health
```

### Step 5: Open Application

```bash
eb open
```

---

## Azure AKS Deployment

### Prerequisites
- Azure CLI installed and logged in
- kubectl installed
- Docker installed

### Step 1: Run Deployment Script

```bash
cd scripts/azure/aks

# Make script executable
chmod +x deploy.sh

# Update variables in deploy.sh
# RESOURCE_GROUP, LOCATION, AKS_CLUSTER_NAME, ACR_NAME

# Run deployment
./deploy.sh
```

### Step 2: Manual Deployment (Alternative)

```bash
# Create resource group
az group create --name newborn-nest-rg --location eastus

# Create ACR
az acr create --resource-group newborn-nest-rg --name newbornnestacr --sku Basic

# Create AKS cluster
az aks create \
  --resource-group newborn-nest-rg \
  --name newborn-nest-aks \
  --node-count 2 \
  --enable-addons monitoring \
  --generate-ssh-keys \
  --attach-acr newbornnestacr

# Get credentials
az aks get-credentials --resource-group newborn-nest-rg --name newborn-nest-aks

# Build and push images
az acr login --name newbornnestacr
docker build -f ../docker/Dockerfile.backend -t newbornnestacr.azurecr.io/newborn-nest-backend:latest ../../
docker push newbornnestacr.azurecr.io/newborn-nest-backend:latest

docker build -f ../docker/Dockerfile.frontend -t newbornnestacr.azurecr.io/newborn-nest-frontend:latest ../../
docker push newbornnestacr.azurecr.io/newborn-nest-frontend:latest

# Deploy to AKS
cd ../../kubernetes
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml
kubectl apply -f persistent-volumes.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml
```

### Step 3: Verify Deployment

```bash
kubectl get all -n newborn-nest
kubectl get service frontend -n newborn-nest
```

---

## Azure ACS Deployment

**Note:** Azure Container Service (ACS) is deprecated. Please use AKS instead.

For legacy reference, see `scripts/azure/acs/docker-compose.azure.yml`

---

## Continuous Deployment

### AWS CodePipeline

See AWS documentation for setting up CodePipeline with:
- Source: GitHub/CodeCommit
- Build: CodeBuild
- Deploy: ECS/EKS

### Azure DevOps

Azure Pipeline configuration is provided in `scripts/azure/azure-pipelines.yml`

---

## Monitoring and Logging

### AWS CloudWatch
- ECS: Logs automatically sent to CloudWatch
- EKS: Use CloudWatch Container Insights
- Elastic Beanstalk: Configured in `.ebextensions`

### Azure Monitor
- AKS: Enable Container Insights during cluster creation
- Application Insights: Add instrumentation to application code

---

## Troubleshooting

### Check Pod Logs (Kubernetes)
```bash
kubectl logs -f <pod-name> -n newborn-nest
kubectl describe pod <pod-name> -n newborn-nest
```

### Check ECS Task Logs
```bash
aws logs tail /ecs/newborn-nest-backend --follow
```

### Check Elastic Beanstalk Logs
```bash
eb logs
```

### Common Issues

1. **Image Pull Errors**: Ensure ECR/ACR permissions are correct
2. **Health Check Failures**: Verify health check endpoints are responding
3. **Volume Mount Issues**: Check PVC/EFS configuration
4. **Network Issues**: Verify security groups and network policies

---

## Security Considerations

1. **Secrets Management**
   - Use AWS Secrets Manager or Azure Key Vault
   - Never commit secrets to version control
   - Update `secrets.yaml` with actual secrets

2. **Network Security**
   - Configure security groups/NSGs properly
   - Use private subnets for backend services
   - Enable WAF for production

3. **Image Scanning**
   - Enable ECR/ACR vulnerability scanning
   - Regularly update base images

4. **RBAC**
   - Configure Kubernetes RBAC policies
   - Use least privilege principle

---

## Cost Optimization

1. **Right-sizing**
   - Monitor resource usage and adjust instance types
   - Use autoscaling policies

2. **Reserved Instances**
   - Consider reserved instances for production workloads

3. **Spot Instances**
   - Use spot instances for non-critical workloads

4. **Storage**
   - Set lifecycle policies for logs
   - Use appropriate storage classes

---

## Support

For issues or questions:
- Check application logs
- Review CloudWatch/Azure Monitor metrics
- Consult cloud provider documentation
