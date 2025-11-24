# EC2 Deployment with Terraform

This Terraform configuration deploys an EC2 instance on AWS with best practices including security groups, encrypted storage, and IMDSv2 enforcement.

## Prerequisites

1. **Terraform** installed (version >= 1.0)
   ```bash
   terraform --version
   ```

2. **AWS CLI** configured with credentials
   ```bash
   aws configure
   ```

3. **AWS Resources** (required before deployment):
   - VPC ID
   - Subnet ID
   - EC2 Key Pair (for SSH access)

## Quick Start

### 1. Create Configuration File

Copy the example configuration and customize it:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your specific values:
- `vpc_id`: Your VPC ID
- `subnet_id`: Your subnet ID
- `key_name`: Your EC2 key pair name
- `allowed_ssh_cidr`: Restrict SSH access (recommended)

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Review Deployment Plan

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted to confirm.

### 5. Get Instance Information

After deployment, Terraform will output:
- Instance ID
- Public/Private IP addresses
- SSH connection string

You can also retrieve outputs anytime:

```bash
terraform output
```

## Configuration Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `aws_region` | AWS region for deployment | `us-east-1` | No |
| `project_name` | Project name for resource naming | `newborn-nest` | No |
| `environment` | Environment name (dev/staging/prod) | `dev` | No |
| `instance_type` | EC2 instance type | `t3.micro` | No |
| `ami_id` | Custom AMI ID (uses latest AL2023 if empty) | `""` | No |
| `key_name` | SSH key pair name | - | Yes |
| `vpc_id` | VPC ID for deployment | - | Yes |
| `subnet_id` | Subnet ID for deployment | - | Yes |
| `allowed_ssh_cidr` | CIDR blocks for SSH access | `["0.0.0.0/0"]` | No |
| `root_volume_size` | Root volume size in GB | `20` | No |
| `associate_eip` | Associate Elastic IP | `false` | No |
| `enable_detailed_monitoring` | Enable detailed monitoring | `false` | No |
| `user_data_script` | User data script for instance initialization | `""` | No |

## Security Features

- **Security Group**: Configured with SSH (22), HTTP (80), and HTTPS (443)
- **Encrypted Storage**: Root volume encrypted by default
- **IMDSv2**: Instance Metadata Service v2 enforced
- **SSH Access Control**: Configurable CIDR blocks for SSH access

## Connecting to Your Instance

After deployment, use the SSH connection string from outputs:

```bash
ssh -i /path/to/your-key.pem ec2-user@<public-ip>
```

Or retrieve it:

```bash
terraform output ssh_connection_string
```

## Managing Your Infrastructure

### Update Configuration

1. Modify `terraform.tfvars` or variables
2. Run `terraform plan` to preview changes
3. Run `terraform apply` to apply changes

### Destroy Infrastructure

To remove all resources:

```bash
terraform destroy
```

Type `yes` when prompted.

## Common Use Cases

### Example 1: Basic Web Server

Add user data script to install and start a web server:

```hcl
user_data_script = <<-EOF
  #!/bin/bash
  yum update -y
  yum install -y httpd
  systemctl start httpd
  systemctl enable httpd
  echo "<h1>Hello from Terraform</h1>" > /var/www/html/index.html
EOF
```

### Example 2: Docker Host

Install Docker on instance launch:

```hcl
user_data_script = <<-EOF
  #!/bin/bash
  yum update -y
  yum install -y docker
  systemctl start docker
  systemctl enable docker
  usermod -aG docker ec2-user
EOF
```

### Example 3: Production Instance with Elastic IP

```hcl
instance_type    = "t3.small"
associate_eip    = true
allowed_ssh_cidr = ["1.2.3.4/32"]  # Your IP only
enable_detailed_monitoring = true
```

## File Structure

```
DeployEC2/
├── main.tf                    # Main Terraform configuration
├── variables.tf               # Variable definitions
├── outputs.tf                 # Output definitions
├── terraform.tfvars.example   # Example configuration
└── README.md                  # This file
```

## Troubleshooting

### Issue: SSH Connection Refused

- Verify security group allows SSH from your IP
- Check that the key pair is correct
- Ensure instance is in a public subnet (if using public IP)

### Issue: Instance Not Accessible

- Check subnet routing (must have route to Internet Gateway)
- Verify Network ACLs allow traffic
- Check security group rules

### Issue: Terraform Plan Fails

- Ensure AWS credentials are configured
- Verify VPC and subnet IDs exist
- Check that key pair exists in the region

## Best Practices

1. **Use a specific IP range** for SSH access instead of `0.0.0.0/0`
2. **Enable Elastic IP** for production instances to maintain consistent IP
3. **Use appropriate instance type** based on workload requirements
4. **Store terraform.tfvars** in `.gitignore` (never commit credentials)
5. **Use remote state** (S3 + DynamoDB) for team collaboration
6. **Tag resources** appropriately for cost tracking

## Next Steps

- Set up CloudWatch alarms for monitoring
- Configure AWS Systems Manager for SSH-less access
- Implement backup strategy using AWS Backup
- Set up load balancing for high availability
- Configure auto-scaling for variable workloads

## Support

For issues or questions:
1. Check AWS CloudFormation console for stack events
2. Review Terraform state: `terraform show`
3. Check AWS EC2 console for instance status
4. Review CloudWatch logs for application issues
