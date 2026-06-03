sed -i 's/SMTP_USER="cskh@mushroomie.io.vn"/SMTP_USER="quantmtb01641@gmail.com"/g' /var/www/mushroomie/.env
sed -i 's/SMTP_USER="cskh@mushroomie.io.vn"/SMTP_USER="quantmtb01641@gmail.com"/g' /var/www/mushroomie/.next/standalone/.env
pm2 restart mushroomie --update-env
