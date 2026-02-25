# ==========================================
# Terraform Configuration for Next.js + PostgreSQL on AWS
# Architecture: VPC with Public (EC2) and Private (RDS) Subnets
# ==========================================

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure AWS Provider (change region as needed)
provider "aws" {
  region = "eu-west-3" # Change to your preferred region
}

# ==========================================
# Variables
# ==========================================

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "project-cost-management"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "PostgreSQL master password"
  type        = string
  sensitive   = true
  # No default - Terraform will prompt or use TF_VAR_db_password env var
}

variable "ec2_key_pair" {
  description = "Name of existing EC2 Key Pair for SSH access"
  type        = string
  default     = "fishale-paris-region-dem" # Provide key pair name
}

variable "my_ip" {
  description = "Your public IP for SSH access (CIDR format, e.g., 203.0.113.0/32)"
  type        = string
  default     = "93.66.127.221/32" # WARNING: Change to your specific IP for security!
}

# ==========================================
# Data Sources
# ==========================================

data "aws_availability_zones" "available" {
  state = "available"
}

# Get latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ==========================================
# VPC and Networking
# ==========================================

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Internet Gateway for Public Subnet
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Public Subnet (for EC2 - Next.js App)
# ==========================================

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true # Auto-assign public IPs

  tags = {
    Name = "${var.project_name}-public-subnet"
    Type = "Public"
  }
}

# Route Table for Public Subnet
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# ==========================================
# Private Subnet (for RDS - PostgreSQL)
# ==========================================

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1] # Different AZ for HA best practice

  tags = {
    Name = "${var.project_name}-private-subnet"
    Type = "Private"
  }
}

# Route Table for Private Subnet (via NAT Gateway)
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-private-rt"
  }
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

# ==========================================
# Security Groups
# ==========================================

# Security Group for EC2 (Next.js App)
resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-ec2-sg"
  description = "Security group for Next.js EC2 instance"
  vpc_id      = aws_vpc.main.id

  # HTTP access from anywhere
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS access from anywhere
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Next.js default port (3000) - for development/testing
  ingress {
    description = "Next.js Dev Port"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH access (restrict to your IP!)
  dynamic "ingress" {
    for_each = var.ec2_key_pair != "" ? [1] : []
    content {
      description = "SSH"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [var.my_ip]
    }
  }

  # Outbound traffic
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ec2-sg"
  }
}

# Security Group for RDS (PostgreSQL)
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Security group for PostgreSQL RDS"
  vpc_id      = aws_vpc.main.id

  # PostgreSQL access only from EC2 security group
  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  # Outbound traffic (RDS doesn't initiate connections, but good practice)
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}

# ==========================================
# RDS Subnet Group (requires 2 subnets for Multi-AZ, but we use 1 for dev)
# Note: RDS requires subnet group spanning 2 AZs, so we create a second private subnet
# ==========================================

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "${var.project_name}-private-subnet-2"
    Type = "Private"
  }
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private.id
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.private.id, aws_subnet.private_2.id]

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

# ==========================================
# RDS Instance (PostgreSQL)
# ==========================================

resource "aws_db_instance" "postgres" {
  identifier = "${var.project_name}-db"

  engine         = "postgres"
  engine_version = "15.15"       # Use latest stable version
  instance_class = "db.t3.micro" # Free tier eligible

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "nextjsapp"
  username = var.db_username
  password = var.db_password

  # Networking
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false # Private subnet only!

  # Backup and maintenance
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Deletion protection (set to true for production)
  deletion_protection = false
  skip_final_snapshot = true # Set to false in production!

  # Performance insights (free tier eligible)
  performance_insights_enabled = false

  tags = {
    Name = "${var.project_name}-postgres"
  }
}

# ==========================================
# EC2 Instance (Next.js App)
# ==========================================

# IAM Role for EC2 (optional, for CloudWatch, SSM, etc.)
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ec2-role"
  }
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# EC2 Instance
resource "aws_instance" "nextjs" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = "t3.micro" # Free tier eligible
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  key_name               = var.ec2_key_pair != "" ? var.ec2_key_pair : null
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  # User data to install Node.js, PM2, and configure the app
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    db_host     = aws_db_instance.postgres.address
    db_name     = aws_db_instance.postgres.db_name
    db_username = var.db_username
    db_password = var.db_password
  }))

  root_block_device {
    volume_size = 30
    volume_type = "gp2"
    encrypted   = true
  }

  tags = {
    Name = "${var.project_name}-nextjs-server"
  }

  depends_on = [aws_db_instance.postgres]
}

# Elastic IP for EC2 (optional but recommended for stable DNS)
resource "aws_eip" "ec2" {
  domain   = "vpc"
  instance = aws_instance.nextjs.id

  tags = {
    Name = "${var.project_name}-ec2-eip"
  }

  depends_on = [aws_internet_gateway.main]
}

# ==========================================
# Outputs
# ==========================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "Public Subnet ID (EC2)"
  value       = aws_subnet.public.id
}

output "private_subnet_id" {
  description = "Private Subnet ID (RDS)"
  value       = aws_subnet.private.id
}

output "ec2_public_ip" {
  description = "Public IP of EC2 instance"
  value       = aws_eip.ec2.public_ip
}

output "ec2_instance_id" {
  description = "EC2 Instance ID"
  value       = aws_instance.nextjs.id
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint (private)"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS Database name"
  value       = aws_db_instance.postgres.db_name
}

output "nextjs_app_url" {
  description = "URL to access Next.js app"
  value       = "http://${aws_eip.ec2.public_ip}:3000"
}

output "ssh_command" {
  description = "SSH command to connect to EC2"
  value       = var.ec2_key_pair != "" ? "ssh -i ~/.ssh/${var.ec2_key_pair}.pem ec2-user@${aws_eip.ec2.public_ip}" : "SSM Session Manager enabled - use AWS Console or CLI"
}
