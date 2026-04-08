const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const axios = require('axios');
const db = require('../database');
const path = require('path');
const fs = require('fs');

const sessions = {};
const qrCodes = {};
const sessionStatus = {};

// 🔥 Restore sessions on server start
const restoreSessions = async () => {
    try {
        const [rows] = await db.pool.query(
            "SELECT session_id FROM whatsapp_sessions WHERE status IN ('CONNECTED','QR_READY','INITIALIZING')"
        );

        for (const row of rows) {
            console.log("♻️ Restoring session:", row.session_id);
            createSession(row.session_id);
        }
    } catch (err) {
        console.log("Restore error:", err);
    }
};

// 🔥 Create Session
const createSession = async (sessionId) => {

    if (sessions[sessionId]) return sessions[sessionId];

    sessionStatus[sessionId] = 'INITIALIZING';

    const sessionPath = path.join(__dirname, `../sessions/${sessionId}`);

    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const client = new Client({
        puppeteer: {
            headless: true,
            userDataDir: sessionPath,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        }
    });

    // 🔥 QR EVENT
    client.on('qr', async (qr) => {
        console.log(`📱 QR generated: ${sessionId}`);

        const qrBase64 = await qrcode.toDataURL(qr);

        qrCodes[sessionId] = qrBase64;
        sessionStatus[sessionId] = 'QR_READY';

        // auto delete QR after 60 sec
        setTimeout(() => delete qrCodes[sessionId], 60000);

        await db.pool.query(
            `INSERT INTO whatsapp_sessions (session_id, status, path, qr_code, created_at, updated_at)
             VALUES (?, ?, ?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE status=?, path=?, qr_code=?, updated_at=NOW()`,
            [sessionId, 'QR_READY', sessionPath, qrBase64, 'QR_READY', sessionPath, qrBase64]
        );
    });

    // 🔥 READY
    client.on('ready', async () => {
        console.log(`✅ Connected: ${sessionId}`);

        sessionStatus[sessionId] = 'CONNECTED';
        qrCodes[sessionId] = '';

        await db.pool.query(
            `UPDATE whatsapp_sessions 
             SET status='CONNECTED', qr_code=NULL, updated_at=NOW() 
             WHERE session_id=?`,
            [sessionId]
        );
    });

    // 🔥 DISCONNECTED
    client.on('disconnected', async (reason) => {
        console.log(`❌ Disconnected ${sessionId}:`, reason);

        sessionStatus[sessionId] = 'DISCONNECTED';
        delete sessions[sessionId];

        await db.pool.query(
            `UPDATE whatsapp_sessions 
             SET status='DISCONNECTED', updated_at=NOW() 
             WHERE session_id=?`,
            [sessionId]
        );

        setTimeout(() => createSession(sessionId), 5000);
    });

    // 🔥 AUTH FAILURE
    client.on('auth_failure', async (msg) => {
        console.log(`❌ Auth failed ${sessionId}:`, msg);

        sessionStatus[sessionId] = 'AUTH_FAILED';

        await db.pool.query(
            `UPDATE whatsapp_sessions 
             SET status='AUTH_FAILED', updated_at=NOW() 
             WHERE session_id=?`,
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

    // ✅ GET QR (FULL FIX)
    getQR: async (req, res) => {
        const { sessionId } = req.query;

        // memory QR
        if (qrCodes[sessionId]) {
            console.log(qrCodes[sessionId]);
            return res.send({
                success: true,
                type: 'QR',
                qr: qrCodes[sessionId]
            });
        }

        // DB fallback
        const [rows] = await db.pool.query(
            "SELECT status, qr_code FROM whatsapp_sessions WHERE session_id=?",
            [sessionId]
        );

        if (!rows.length) {
            return res.send({ success: false, message: 'Session not found' });
        }

        const row = rows[0];

        if (row.qr_code) {
            return res.send({
                success: true,
                type: 'QR',
                qr: row.qr_code
            });
        }

        if (row.status === 'CONNECTED') {
            return res.send({
                success: true,
                type: 'CONNECTED'
            });
        }

        return res.send({
            success: true,
            type: 'LOADING',
            status: row.status
        });
    },

    // ✅ STATUS
    status: async (req, res) => {
        const { sessionId } = req.query;

        res.send({
            success: true,
            status: sessionStatus[sessionId] || 'NOT_FOUND'
        });
    },

    // ✅ SEND MESSAGE (FIXED)
    sendMessage: async (req, res) => {
        try {
            const { sessionId, number, message } = req.body;

            let client = sessions[sessionId];

            if (!client) {
                console.log("♻️ Recreating session:", sessionId);
                client = await createSession(sessionId);
            }

            const state = await client.getState().catch(() => null);

            if (state !== 'CONNECTED') {
                return res.send({ success: false, message: 'WhatsApp not connected' });
            }

            const chatId = number.includes('@c.us') ? number : number + '@c.us';

            await client.sendMessage(chatId, message);

            res.send({ success: true, message: 'Message sent successfully' });

        } catch (err) {
            console.log(err);
            res.send({ success: false, message: 'Failed to send message' });
        }
    },

    // ✅ SEND PDF
    sendPDF: async (req, res) => {
        try {
            const { sessionId, number, fileUrl, fileName } = req.body;

            let client = sessions[sessionId];

            if (!client) {
                client = await createSession(sessionId);
            }

            const response = await axios.get(fileUrl, {
                responseType: 'arraybuffer'
            });

            const media = new MessageMedia(
                'application/pdf',
                Buffer.from(response.data).toString('base64'),
                fileName || 'file.pdf'
            );

            await client.sendMessage(number + '@c.us', media);

            res.send({ success: true, message: 'PDF sent successfully' });

        } catch (err) {
            console.log(err);
            res.send({ success: false, message: 'Failed to send PDF' });
        }
    }
};

// 🔥 AUTO RESTORE ON SERVER START
// restoreSessions();