module.exports = {
  apps: [
    {
      name: 'rida-frontend',
      cwd: '/Users/workstudy/rida',
      script: 'npx',
      args: 'next dev',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
      },
      max_restarts: 20,
      restart_delay: 2000,
      autorestart: true,
    },
    {
      name: 'rida-convex',
      cwd: '/Users/workstudy/rida',
      script: 'npx',
      args: 'convex dev',
      interpreter: 'none',
      max_restarts: 20,
      restart_delay: 3000,
      autorestart: true,
    },
  ],
}