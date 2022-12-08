const {createLogger,transports,format} = require('winston');
var moment = require('moment')
var fs = require('fs')
var path = require('path')

module.exports=loggers = createLogger({
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

module.exports.getLogFileStream = (logType = 'unknown') => {
  if (!fs.existsSync(path.join(__dirname, '../logs/')))
    return fs.mkdirSync(path.join(__dirname, '../logs/'))
  if (logType != 'access' && logType != 'error' && logType != 'info') {
    logType == 'unknown'
  }

  var logFile = moment().format('YYYY-MM-DD') + `-${logType}.log`
  // create a write stream (in append mode)
  var accessLogStream = fs.createWriteStream(
    path.join(__dirname, '../logs/', logFile),
    { flags: 'a' }
  )
  return accessLogStream
}

module.exports.addLog = (logType = 'unknown', body) => {
  if (!fs.existsSync(path.join(__dirname, '../logs/')))
    return fs.mkdirSync(path.join(__dirname, '../logs/'))
  var logFile = moment().format('YYYY-MM-DD') + `-${logType}.log`
  // create a write stream (in append mode)
  var accessLogStream = fs.createWriteStream(
    path.join(__dirname, '../logs/', logFile),
    { flags: 'a' }
  )
  accessLogStream.write(
    `${moment().format('MMMM-Do-YYYY, h:mm:ss a')} ` + body + `\n`
  )
}