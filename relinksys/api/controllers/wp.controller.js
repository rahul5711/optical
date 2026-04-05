const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const axios = require('axios');
const db = require('../database');

const sessions = {};
const qrCodes = {};
const sessionStatus = {};

// 🔥 Create Session
const createSession = async (sessionId) => {

    if (sessions[sessionId]) return sessions[sessionId];

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: sessionId }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--single-process'
            ]
        }
    });

    // QR
    client.on('qr', async (qr) => {
        qrCodes[sessionId] = await qrcode.toDataURL(qr);
        sessionStatus[sessionId] = 'QR_READY';

        await db.pool.query(
            `INSERT INTO whatsapp_sessions (session_id, status, created_at, updated_at)
             VALUES (?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE status=?, updated_at=NOW()`,
            [sessionId, 'QR_READY', 'QR_READY']
        );
    });

    // READY
    client.on('ready', async () => {
        sessionStatus[sessionId] = 'CONNECTED';
        qrCodes[sessionId] = '';

        await db.pool.query(
            `UPDATE whatsapp_sessions SET status='CONNECTED', updated_at=NOW() WHERE session_id=?`,
            [sessionId]
        );
    });

    // DISCONNECTED
    client.on('disconnected', async () => {
        sessionStatus[sessionId] = 'DISCONNECTED';
        delete sessions[sessionId];

        await db.pool.query(
            `UPDATE whatsapp_sessions SET status='DISCONNECTED', updated_at=NOW() WHERE session_id=?`,
            [sessionId]
        );
    });

    // AUTH FAIL
    client.on('auth_failure', async () => {
        sessionStatus[sessionId] = 'AUTH_FAILED';

        await db.pool.query(
            `UPDATE whatsapp_sessions SET status='AUTH_FAILED', updated_at=NOW() WHERE session_id=?`,
            [sessionId]
        );
    });

    await client.initialize();

    sessions[sessionId] = client;
    return client;
};




module.exports = {

    // ✅ Start Session
    startSession: async (req, res) => {
        try {
            const { sessionId } = req.body;

            if (!sessionId) {
                return res.send({ success: false, message: 'sessionId required' });
            }

            await createSession(sessionId);

            res.send({ success: true, message: 'Session started' });

        } catch (err) {
            console.log(err);
            res.send({ success: false });
        }
    },

    // ✅ Get QR
    getQR: async (req, res) => {
        const { sessionId } = req.query;

        if (!qrCodes[sessionId]) {
            return res.send({ success: false, message: 'QR not ready' });
        }

        console.log("getQR", qrCodes[sessionId]);


        res.send({ success: true, qr: qrCodes[sessionId] });
    },

    // ✅ Status
    status: async (req, res) => {
        const { sessionId } = req.query;

        res.send({
            success: true,
            status: sessionStatus[sessionId] || 'NOT_FOUND'
        });
    },

    // ✅ Send Message
    sendMessage: async (req, res) => {
        try {
            const { sessionId, number, message } = req.body;

            const client = sessions[sessionId];

            if (!client) {
                return res.send({ success: false, message: 'Session not found' });
            }

            const state = await client.getState().catch(() => null);

            if (state !== 'CONNECTED') {
                return res.send({ success: false, message: 'WhatsApp not connected' });
            }

            const chatId = number.includes('@c.us') ? number : number + '@c.us';

            await client.sendMessage(chatId, message);

            return res.send({
                success: true,
                message: 'Message sent successfully'
            });

        } catch (err) {
            console.log(err);
            return res.status(200).send({
                success: false,
                message: 'Failed to send message. WhatsApp may be disconnected.'
            });
        }
    },

    // ✅ Send PDF
    sendPDF: async (req, res) => {
        try {
            const { sessionId, number, fileUrl, fileName } = req.body;

            const client = sessions[sessionId];

            if (!client) {
                return res.send({ success: false, message: 'Session not found' });
            }

            const response = await axios.get(fileUrl, {
                responseType: 'arraybuffer'
            });

            const media = new MessageMedia(
                'application/pdf',
                Buffer.from(response.data).toString('base64'),
                fileName || 'file.pdf'
            );

            const chatId = number + '@c.us';

            await client.sendMessage(chatId, media);

            return res.send({
                success: true,
                message: 'PDF sent successfully'
            });

        } catch (err) {
            console.log(err);
            return res.status(200).send({
                success: false,
                message: 'Failed to send message. WhatsApp may be disconnected.'
            });
        }
    }

};