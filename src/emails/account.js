const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_ID,
    pass: process.env.GMAIL_PASS
  }
});

const sendWelcomeEmail = (name, email, password, res) => {
    transporter.sendMail({
        from: 'tcslearningapplication@gmail.com',
        to: email,
        subject: 'Registered Successfully',
        text: `Welcome to Shiksha Durat, ${name}

Here is your credential: 

Username: ${email}
Password: ${password}

Thanks & Regards
Shiksha Durat Team `

    },(error) => {
        if(error){
            res.status(400).send({
                status: false,
                message: "Something went wrong while sending Email",
              });
        }
        else{
            res.status(200).send({
                status: true,
                message: "Student added Successfully",
              });
        }
    });
}

const sendOtpOnEmailForVerifyAccount = (schoolName, email, otp,res) => {
    transporter.sendMail({
        from: 'tcslearningapplication@gmail.com',
        to: email,
        subject: 'OTP Generated',
        text: `Welcome to OnlineSchool, ${schoolName}

Here is your OTP: ${otp}
Click here to verify:https://siksha-durat.netlify.app/verification?email=${email}


Thanks & Regards
Shiksha Durat Team`

    },(error) => {
        if(error){
            res.status(400).send({  
                status: false,
                message: "Something went wrong while sending Email",
              });
        }
        else{
            
            res.status(200).send({
                status: true,
                message: "Otp has been send to registered email id.",
              });
        }
    });
}

const sendOtpOnEmailForForgetPassword = (email,otp,res) => {
    transporter.sendMail({
        from: 'tcslearningapplication@gmail.com',
        to: email,
        subject: 'OTP for reset password',
        text: `Welcome to OnlineSchool,

Here is your OTP: ${otp}

Thanks & Regards
Shiksha Durat Team `

    },(error) => {
        if(error){
            res.status(400).send({  
                status: false,
                message: "Something went wrong while sending Email",
              });
        }
        else{
            
            res.status(200).send({
                status: true,
                message: "Otp has been send to registered email id.",
              });
        }
    });
}

const sendSessionNotification = (name, email,res) => {
    transporter.sendMail({
        from: 'tcslearningapplication@gmail.com',
        to: email,
        subject: 'Session started',
        text: `Dear ${name},

Your session going to start please join as soon as possible

Thanks & Regards
Shiksha Durat Team `
    },(error) => {
        if(error){
            res.status(400).send({
                status: false,
                message: "Something went wrong while sending Email"
              });
        }
    });
}

const sendlectureVideoNotification = (name, email,res) => {
    transporter.sendMail({
        from: 'tcslearningapplication@gmail.com',
        to: email,
        subject: 'New Video Lecture Uploaded!',
        text: `Dear ${name},

New video lecture has been uploaded. Do watch the video!

Thanks & Regards
Shiksha Durat Team`
    },(error) => {
        if(error){
            res.status(400).send({
                status: false,
                message: "Something went wrong while sending Email"
              });
        }
    });
}

module.exports = {
    sendWelcomeEmail,
    sendOtpOnEmailForVerifyAccount,
    sendOtpOnEmailForForgetPassword,
    sendSessionNotification,
    sendlectureVideoNotification
}
