#!/bin/bash
# ==========================================
# User Data Script for Next.js + PostgreSQL
# ==========================================

# Update system
sudo dnf update -y

# Create 2GB Swap file (Highly recommended for t3.micro/1GB RAM)
if [ ! -f /swapfile ]; then
    sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap file created"
fi

# Install Node.js 20 (Using NodeSource for latest v20)
curl -sL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Install PM2 globally
sudo npm install pm2 -g

# Create application directory
mkdir -p /home/ec2-user/app
chown ec2-user:ec2-user /home/ec2-user/app
cd /home/ec2-user/app

# Set Environment Variables for Database (passed from Terraform)
cat <<EOF > .env.local
DATABASE_URL="postgresql://${db_username}:${db_password}@${db_host}:5432/${db_name}"
PORT=3000
NODE_ENV=production
EOF

# Note: In a real scenario, you would clone your repo here:
# git clone https://github.com/your-repo/project.git .
# npm install
# npm run build
# pm2 start npm --name "nextjs-app" -- start

# Simple health check for verify setup
echo "Provisioning complete" > /home/ec2-user/provisioning_done
