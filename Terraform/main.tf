provider "aws" {
  region = "ap-south-1"
}

resource "aws_instance" "newborn_nest_server" {
  ami             = "ami-02b8269d5e85954ef"
  instance_type   = "t3.micro"
  security_groups = [aws_security_group.sg_newborn_nest_server.name]

  user_data = <<-EOF
        #!/bin/bash
        
        sudo apt-get update -y

        # install
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
        sudo apt install -y npm
        sudo apt install -y nginx
        sudo systemctl start nginx
        sudo systemctl enable nginx
        sudo npm install -g pm2
        sudo apt install git

        sudo cat "Hello 1" > $HOME/log.txtvar/log/user_log.txt

        # get public ip
        TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
        PUBLIC_IP=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4)
        
        sudo cat "Hello 2" >> var/log/user_log.txt
        sudo cat "Hello 2 $PUBLIC_IP" >> var/log/user_log.txt

        #### GitHub get app
        # Create app directory
        sudo mkdir -p /var/www/newborn-nest
        sudo chown -R $USER:$USER /var/www/newborn-nest
        cd /var/www/newborn-nest 
        git clone --branch main https://github.com/rshivanna/newborn-nest-app.git /var/www/newborn-nest 
        sudo chmod -R 777 /var/www/newborn-nest
        
        #### NGINX setting
        # Remove default site
        sudo rm -r /etc/nginx/sites-available/default
        # Create nginx config and symbolic link
        sudo cp  /var/www/newborn-nest/scripts/newborn-nest /etc/nginx/sites-available/        
        sudo ln -s /etc/nginx/sites-available/newborn-nest /etc/nginx/sites-enabled/
        # self signed ssl
        sudo mkdir -p /etc/nginx/ssl
        sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/ssl/selfsigned.key -out /etc/nginx/ssl/selfsigned.crt -subj "/C=US/ST=California/L=Irvine/O=MyOrganization/OU=MyUnit/CN=mysitesunknon.com"

        #### Frontend *****
        cd /var/www/newborn-nest
        sudo echo "VITE_API_URL=/api" > .env       
        npm install
        npm run build
        
        #### Backend *****
        cd /var/www/newborn-nest/backend        
        sudo npm install        
        sudo cp .env.production .env        
        FILE="/var/www/newborn-nest/backend/.env"
        OLD_IP="00.000.000.000"      
        sed -i "s|CORS_ORIGIN=https://$OLD_IP|CORS_ORIGIN=$PUBLIC_IP|g" "$FILE"        
        pm2 start server.js --name newborn-nest
        pm2 save
        pm2 startup systemd

      EOF


  tags = {
    Name = "newborn_nest_server"
  }
}

resource "aws_security_group" "sg_newborn_nest_server" {
  name        = "sg_newborn_nest_server"
  description = "sg_newborn_nest_server"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}