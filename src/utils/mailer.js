import Mailgen from "mailgen";
import nodemailer from "nodemailer"



const sendEmail = async (options) => {
    const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
        name: 'task manager',
        link: 'https://taskmanagelink.com'
    }
   });

   const emailPlainText = mailGenerator.generatePlaintext(options.mailGenContent) 
   const emailHtml = mailGenerator.generate(options.mailGenContent) 


    const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

    const email = {
      from: "mail.taskmanager@example.com",
      to: options.email,
      subject: options.subject,
      text:emailPlainText,
      html:emailHtml
    }
  
    try {
        await transporter.sendMail(email)
    } catch (error) {
        console.log("Email service failed siliently. Make sure that you have provided your MAILTRAP credentials in the .env file");
        console.error("Error",error)
    }
}



const emailVerificationMailContent = (username,verificationLink)=> {
    return {
        body: {
        name: username,
        intro: 'Welcome to base camp! We\'re very excited to have you on board.',
        action: {
            instructions: 'To verify your email, please click here:',
            button: {
                color: '#22BC66',
                text: 'Confirm your account',
                link: verificationLink
            }
        },
        outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
    }
    }
}

const passResetMailContent = (username,passResetLink)=> {
    return {
        body: {
        name: username,
        intro: 'We got a request to reset the password of your account',
        action: {
            instructions: 'To reset your password, please click on the following button or link:',
            button: {
                color: '#22BC66',
                text: 'Confirm your account',
                link: passResetLink
            }
        },
        outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
    }
    }
}


export {passResetMailContent,emailVerificationMailContent,sendEmail}



