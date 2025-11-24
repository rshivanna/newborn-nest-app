output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.main.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.main.public_ip
}

output "instance_private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.main.private_ip
}

output "instance_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.main.public_dns
}

output "elastic_ip" {
  description = "Elastic IP address (if enabled)"
  value       = var.associate_eip ? aws_eip.main[0].public_ip : null
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.ec2_sg.id
}

output "ami_id" {
  description = "AMI ID used for the instance"
  value       = aws_instance.main.ami
}

output "ssh_connection_string" {
  description = "SSH connection string"
  value       = "ssh -i ${var.key_name}.pem ec2-user@${var.associate_eip ? aws_eip.main[0].public_ip : aws_instance.main.public_ip}"
}
