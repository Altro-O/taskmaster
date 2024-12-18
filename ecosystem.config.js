module.exports = {
  apps: [{
    name: 'taskmaster',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      DOMAIN: 'mytasks.store',
      API_PORT: 3000
    }
  }]
}; 