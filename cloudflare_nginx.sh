#!/bin/bash
echo "Fetching Cloudflare IPs..."
curl -s https://www.cloudflare.com/ips-v4 > /tmp/cf_ips
echo "" >> /tmp/cf_ips
curl -s https://www.cloudflare.com/ips-v6 >> /tmp/cf_ips

echo "" > /etc/nginx/conf.d/cloudflare.conf
while read ip; do
  if [ ! -z "$ip" ]; then
    echo "set_real_ip_from $ip;" >> /etc/nginx/conf.d/cloudflare.conf
  fi
done < /tmp/cf_ips

echo "real_ip_header CF-Connecting-IP;" >> /etc/nginx/conf.d/cloudflare.conf
systemctl reload nginx
echo "Nginx configured for Cloudflare!"
