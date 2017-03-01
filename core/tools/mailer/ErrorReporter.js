/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var util        = require('util')
var nodemailer  = require('nodemailer')
var logger      = log4js.getLogger('ErrorReporter')

module.exports = function (err, revision) {
  if (!process.env.GOOGLE_MAILER_ACCOUNT || !process.env.GOOGLE_MAILER_PASSWORD) {
    return
  }

  logger.trace('Reporting error: ' + err)

  var config = util.format(
    'smtps://%s%40gmail.com:%s@smtp.gmail.com',
    process.env.GOOGLE_MAILER_ACCOUNT,
    process.env.GOOGLE_MAILER_PASSWORD
  )

  var transporter = nodemailer.createTransport(config)
  // TODO: make these fields configurable
  var mailOptions = {
    from: '"SotaTek Tester" <sotatek.test@gmail.com>',
    to: 'nguyenhuuan@gmail.com',
    subject: '[Exclusiv] Error happens - rev:' + revision.substring(0, 7),
    text: 'In revision: ' + revision.substring(0, 7) + '\n' + util.inspect(err)
  }

  transporter.sendMail(mailOptions, done)
}

function done (err, info) {
  if (err) {
    return logger.error('Send mail failed: ' + util.inspect(err))
  }

  logger.trace('Email about error sent: ' + info.response)
}
