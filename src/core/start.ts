import nodemon from 'nodemon'

nodemon('--watch src/utils/reloadme.json --exec ts-node src/core/app.ts')
  .on('log', ({ colour }) => console.log(colour))
