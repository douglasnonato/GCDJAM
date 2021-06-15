const auth = require('static-auth');
 
// Example with Vercel
module.exports = auth(
  '/admin',
  (user, pass) => (user === 'admin' && pass === 'admin') // (1)
);