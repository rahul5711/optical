const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const {
    print,
    getPrinters,
    getDefaultPrinter,
} = require("pdf-to-printer");

const ModuleName = "Print";


// ===============================
// Health Check
// ===============================

const getInfo = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: `${ModuleName} API Working`,
    });
};


const { exec } = require("child_process");

const getPrintersHandler2 = async (req, res) => {

    exec(
        'powershell -NoProfile -Command "Get-Printer | Select-Object Name,DriverName,PortName,Default | ConvertTo-Json -Compress"',
        (error, stdout, stderr) => {

            if (error) {
                return res.status(500).json({
                    success: false,
                    message: error.message
                });
            }

            if (stderr) {
                return res.status(500).json({
                    success: false,
                    message: stderr
                });
            }

            if (!stdout.trim()) {
                return res.json({
                    success: true,
                    data: []
                });
            }

            try {

                let printers = JSON.parse(stdout);

                if (!Array.isArray(printers)) {
                    printers = [printers];
                }

                return res.json({
                    success: true,
                    data: printers
                });

            } catch (err) {

                console.log(stdout);

                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            }

        }
    );

};

const getPrintersHandler = async (req, res) => {

    exec(
        'powershell -NoProfile -Command "Get-CimInstance Win32_Printer | Select-Object Name,DriverName,PortName,Default | ConvertTo-Json -Compress"',
        (error, stdout, stderr) => {

            if (error) {
                return res.status(500).json({
                    success: false,
                    message: error.message
                });
            }

            if (!stdout || !stdout.trim()) {
                return res.json({
                    success: true,
                    defaultPrinter: null,
                    data: []
                });
            }

            try {

                let printers = JSON.parse(stdout);

                if (!Array.isArray(printers)) {
                    printers = [printers];
                }

                const defaultPrinter =
                    printers.find(p => p.Default === true) || null;

                return res.status(200).json({
                    success: true,
                    defaultPrinter,
                    data: printers
                });

            } catch (err) {

                return res.status(500).json({
                    success: false,
                    message: err.message,
                    stdout
                });

            }

        }
    );

};



// ===============================
// Print PDF From URL
// ===============================
const printURLHandler = async (req, res) => {

    try {

        const pdfUrl = req.body.url;

        const printer = req.body.printer;

        if (!pdfUrl) {
            return res.status(400).json({
                success: false,
                message: "PDF URL is required."
            });
        }

        const fileName = `invoice_${Date.now()}.pdf`;

        const filePath = path.join(__dirname, "../uploads", fileName);

        const response = await axios({
            method: "GET",
            url: pdfUrl,
            responseType: "stream"
        });

        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {

            writer.on("finish", resolve);

            writer.on("error", reject);

        });

        await print(filePath, {
            printer,
            silent: true
        });

        fs.unlinkSync(filePath);

        return res.json({
            success: true,
            message: "Printed Successfully"
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};


module.exports = {
    getInfo,
    getPrintersHandler,
    printURLHandler,
};