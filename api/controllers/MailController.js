module.exports = {
	
    mailtosendfunc:function(toParam, textParam){
        var nodemailer = require('nodemailer');
        var transporter = nodemailer.createTransport("SMTP", {
          host: process.env.NODEMAILER_HOST,
          port: process.env.NODEMAILER_PORT,
          auth: { user: process.env.NODEMAILER_USER, pass: process.env.NODEMAILER_PASS }
        });

         var mailOptions = {
          //html: '<h3> Fanar VMS </h3>',
          from: process.env.SUPERADMIN_EMAIL,
          to: toParam, 
          subject: sails.config.mailgun.prepend_subject,
          text: textParam
       }

        transporter.sendMail(mailOptions, function(err, response){
          if(err){
            //res.send(500, "Error Sending " + err);
          }else{
            //res.send(200, response);
          }
        });

    },
  
};

