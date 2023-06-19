module.exports.mailgun = {
    usessl: true,
    port: 465,
    to: process.env.SUPERADMIN_EMAIL,
    prepend_subject: 'Fanar VMS  | Mailing Service for your password | ',
    user: process.env.MAILGUN_USER,
    pass: process.env.MAILGUN_PASS
  }