git remote add origin https://github.com/rshivanna/Newborn-Nest-App.git

git remote set-url origin https://github.com/rshivanna/Newborn-Nest-App.git

ssh -i kp-newbornnestapp.pem ubuntu@ec2-52-66-227-191.ap-south-1.compute.amazonaws.com

scp -i ./kp-newbornnestapp.pem ./cert.pem ubuntu@52.66.227.191:/home/ubuntu/

C:\MyProject\AI\Satya\aws

sudo mkdir -p /etc/nginx/ssl

sudo openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/selfsigned.key \
  -out /etc/nginx/ssl/selfsigned.crt

https://52.66.227.191:5000/api/health

ssh -i ./kp-newbornnestapp.pem  ubuntu@65.2.184.159


PS1='\u@\h:\w\$ '
alias ls='ls --color=never'
alias grep='grep --color=never'
export LS_COLORS=

sed -i "s|C52.66.227.191|52.66.212.73|g" ".env"
