"use strict"
const nodemailer = require("nodemailer");
const createError = require('http-errors')
var position = 0;

module.exports.sendMail = async ({ to, cc, subject, body, attachments }, callback) => {
    const Transporters = [];
    const t = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'relinksys@gmail.com',
            pass: 'hgsv zxim olqf rwhm'
        }
    });
    Transporters.push(t);
    if (!Transporters.length) {
        callback(createError.BadRequest('Mail Not Configured!'), null)
    }
    if (position > Transporters.length) {
        position = 0;
    }
    try {
        const info = await Transporters[position].sendMail({
            from: 'relinksys@gmail.com',
            to: to,
            cc: cc,
            subject,
            html: body,
            attachments: attachments
        });
    } catch (error) {
        console.log('error-service', error);
        callback(error, null);
    }
    position++;
    if (position == Transporters.length) {
        position = 0;
    }
}