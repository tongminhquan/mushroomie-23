sed -i 's/SMTP_PASSWORD="mtpv wnnt rmao lumf"/SMTP_PASSWORD="mtpvwnntrmaolumf"/g' /var/www/mushroomie/.env
sed -i 's/SMTP_PASSWORD="mtpv wnnt rmao lumf"/SMTP_PASSWORD="mtpvwnntrmaolumf"/g' /var/www/mushroomie/.next/standalone/.env
pm2 restart mushroomie --update-env
