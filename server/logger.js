const {createLogger,transports,format} = require('winston');
var moment = require('moment')
const date = moment().format('DD-MM-YYYY')

const loggers = createLogger({
  transports: [
    new transports.File({
      level: 'info',
      filename :'filelog-info.log',
      json: true,
      timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS', 
      format: format.combine(format.timestamp(), format.simple())
    }),
    new transports.File({
      level: 'error',
      filename: 'filelog-error.log',
      json: true,
      format: format.combine(format.timestamp(), format.json())
    })
  ]
});

module.exports = loggers