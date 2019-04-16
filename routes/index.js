var checkAuth = require('middleware/checkAuth');

module.exports = function (app) {

    app.use('/', require('./home'));

    app.use('/quick-chat', require('./quick_chat'));

    app.use('/login', require('./login'));

    app.use('/register', require('./register'));

    app.use('/logout', require('./logout'));

    app.use('/profile', require('./profile'));

    app.use('/conversations', require('./conversations'));
};