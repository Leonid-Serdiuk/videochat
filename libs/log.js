var winston = require('winston');
var ENV = process.env.NODE_ENV;

function getLogger(module) {

    if(module.filename.split('/').length > 1)
        var path = module.filename.split('/').slice(-3).join('/');
    else if (module.filename.split('\\').length > 1)
        var path = module.filename.split('\\').slice(-3).join('\\');

        return new winston.Logger({
            transports: [
                new winston.transports.Console({
                    colorize: true,
                    level: ENV == 'development' ? 'debug' : 'error',
                    label: path
                }),

                new winston.transports.File({filename: 'logs/debug.log', level:'debug'})
            ]
        });
}

module.exports = getLogger;