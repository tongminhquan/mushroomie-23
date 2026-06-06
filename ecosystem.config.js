module.exports = {
  apps: [
    {
      name: 'mushroomie_pm2',
      script: 'server.js',
      cwd: '/var/www/mushroomie/.next/standalone',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOSTNAME: '127.0.0.1',
      },
    },
  ],
};
