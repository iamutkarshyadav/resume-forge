const { nextStart } = require('next/dist/cli/next-dev');
nextStart(['.']).catch(err => {
  console.error('Dev server error:', err);
  process.exit(1);
});
