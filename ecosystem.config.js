module.exports = {
  apps: [
    {
      name: 'ecommerce-backend',
      script: 'dist/index.js',
      exec_mode: 'cluster',
      instances: 'max', // Auto-scale to utilize all available CPU cores
      env: {
        NODE_ENV: 'production'
      },
      node_args: [
        '--max-old-space-size=4096', // Allocate 4GB heap size to prevent OOM
        '--expose-gc'
      ],
      max_memory_restart: '3G',
      watch: false,
      merge_logs: true,
      autorestart: true
    }
  ]
};