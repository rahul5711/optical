"use strict"
const nodemailer = require("nodemailer");
const createError = require('http-errors')
const dbConfig = require('../helpers/db_config');
var position = 0;

module.exports.sendMail = async ({ to, cc, subject, body, attachments = null, shopid = 0, companyid = 0 }, callback) => {
    const Transporters = [];
    let connection;
    let config = {
        email: 'opticalguruindia@gmail.com',
        password: 'crgl ilnf kizf wxud'
    }

    if (shopid !== 0 && companyid !== 0) {
        const db = await dbConnection(companyid);
        if (db.success === false) {
            return res.status(200).json(db);
        }
        connection = await db.getConnection();

        const [fetchConfig] = await connection.query(`select ID, CompanyID, AppPassword, IsEmailConfiguration, Email from shop where CompanyID = ${companyid} and ID = ${shopid}`)


        if (fetchConfig.length && (fetchConfig[0].IsEmailConfiguration === true || fetchConfig[0].IsEmailConfiguration === "true")) {
            config.email = fetchConfig[0].Email
            config.password = fetchConfig[0].AppPassword
        }

    }

    const t = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: `${config.email}`,
            pass: `${config.password}`
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
            from: `${config.email}`,
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

module.exports.companySendMail = async ({ to, cc, subject, body, attachments = null, shopid = 0, companyid = 0 }, callback) => {
    const Transporters = [];
    let connection;
    let config = {
        email: 'opticalguruindia@gmail.com',
        password: 'crgl ilnf kizf wxud'
    }

    if (shopid === 0 || companyid === 0) {
        callback(createError.BadRequest('Mail Not Configured!'), null)
    }

    if (shopid !== 0 && companyid !== 0) {
        const db = await dbConnection(companyid);
        if (db.success === false) {
            return res.status(200).json(db);
        }
        connection = await db.getConnection();

        const [fetchConfig] = await connection.query(`select ID, CompanyID, AppPassword, IsEmailConfiguration, Email from shop where CompanyID = ${companyid} and ID = ${shopid}`)


        if (fetchConfig.length && (fetchConfig[0].IsEmailConfiguration === true || fetchConfig[0].IsEmailConfiguration === "true")) {
            config.email = fetchConfig[0].Email
            config.password = fetchConfig[0].AppPassword
        } else {
            callback(createError.BadRequest('Mail Not Configured!'), null)
        }

    }

    const t = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: `${config.email}`,
            pass: `${config.password}`
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
            from: `${config.email}`,
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

let dbCache = {}; // Cache for storing database instances

async function dbConnection(CompanyID) {
    // Check if the database instance is already cached
    if (dbCache[CompanyID]) {
        return dbCache[CompanyID];
    }

    // Fetch database connection
    const db = await dbConfig.dbByCompanyID(CompanyID);

    if (db.success === false) {
        return db;
    }
    // Store in cache
    dbCache[CompanyID] = db;
    return db;
}