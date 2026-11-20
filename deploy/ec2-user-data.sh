#!/bin/bash
# Paste this into "Advanced details -> User data" when launching an Ubuntu 24.04 EC2 instance.
# It installs Docker + Docker Compose + AWS CLI and adds 2 GB swap (helps on 1 GB t3.micro).
set -e

apt-get update -y
apt-get install -y docker.io docker-compose-v2 unzip curl
systemctl enable --now docker
usermod -aG docker ubuntu

# AWS CLI v2 (needed to log in to ECR)
curl -sSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp
/tmp/aws/install
rm -rf /tmp/aws /tmp/awscliv2.zip

# 2 GB swap file
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

mkdir -p /home/ubuntu/hireflow
chown ubuntu:ubuntu /home/ubuntu/hireflow
