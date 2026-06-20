module.exports = {
  apps: [
    {
      name: 'mushroomie_pm2',
      script: 'server.js',
      cwd: '/var/www/mushroomie/.next/standalone',
      // Single fork only: the VPS has ~1GB RAM shared with a 2nd app + MySQL.
      // Cluster mode would duplicate the ~150MB baseline per worker — do NOT use it here.
      instances: 1,
      exec_mode: 'fork',
      // Controlled-restart safety net for the constrained VPS: if RSS runs away
      // (leak/spike) PM2 restarts cleanly instead of letting the kernel OOM-killer
      // take a random process (e.g. MySQL). App normally sits ~150MB RSS; 480M leaves
      // headroom for transient sharp() image-decode spikes while still firing well
      // before the box is forced into a kernel OOM (~600MB+).
      max_memory_restart: '480M',
      // Crash-loop backoff: if the process keeps dying within 30s, stop after 10 tries
      // instead of hammering the box.
      min_uptime: '30s',
      max_restarts: 10,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOSTNAME: '127.0.0.1',
        // Cap V8 heap so GC stays aggressive on the 1GB box (default ~2GB is larger
        // than the whole VPS). RSS ≈ heap + ~70MB overhead + sharp native memory.
        NODE_OPTIONS: '--max-old-space-size=384',
        // Bound the libuv threadpool (sharp/libvips use it) so concurrent image
        // decodes can't fan out into a large native-memory spike on the small box.
        UV_THREADPOOL_SIZE: '2',
      },
    },
  ],
};
