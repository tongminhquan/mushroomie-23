#!/bin/bash
sed -i 's/^SMTP_USER=.*/SMTP_USER="cskh@mushroomie.io.vn"/g' /var/www/mushroomie/.env
sed -i 's|^SMTP_PASSWORD=.*|SMTP_PASSWORD="Conma11062008@"|g' /var/www/mushroomie/.env
echo "Done"
