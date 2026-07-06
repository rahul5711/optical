const axios = require("axios");

const ModuleName = "Domain";

const vercel = axios.create({
    baseURL: "https://api.vercel.com",
    headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
        "Content-Type": "application/json",
    },
    timeout: 10000,
});

// ===============================
// Health Check
// ===============================
const getInfo = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: `${ModuleName} API Working`,
    });
};

// ===============================
// Add Domain
// ===============================
const addDomainHandler = async (req, res) => {
    try {
        const { domain } = req.body;

        if (!domain) {
            return res.status(400).json({
                success: false,
                message: "Domain is required.",
            });
        }

        const response = await vercel.post(
            `/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains`,
            {
                name: domain,
            }
        );

        return res.status(200).json({
            success: true,
            message: "Domain added successfully.",
            data: response.data,
        });
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            success: false,
            message:
                error.response?.data?.error?.message ||
                error.response?.data?.message ||
                error.message,
        });
    }
};

// ===============================
// Get Domain Details
// ===============================
const getDomainHandler = async (req, res) => {
    try {
        const { domain } = req.query;

        if (!domain) {
            return res.status(400).json({
                success: false,
                message: "Domain is required.",
            });
        }

        const response = await vercel.get(
            `/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain}`
        );

        return res.status(200).json({
            success: true,
            data: response.data,
        });
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            success: false,
            message:
                error.response?.data?.error?.message ||
                error.response?.data?.message ||
                error.message,
        });
    }
};

// ===============================
// Verify Domain
// ===============================
const verifyDomainHandler = async (req, res) => {
    try {
        const { domain } = req.query;

        if (!domain) {
            return res.status(400).json({
                success: false,
                message: "Domain is required.",
            });
        }

        // Get Domain Configuration
        const configResponse = await vercel.get(
            `/v6/domains/${domain}/config`
        );

        // Get Domain Details
        const domainResponse = await vercel.get(
            `/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain}`
        );

        let verification = null;

        // Verify only if not already verified
        if (!domainResponse.data.verified) {
            try {
                const verifyResponse = await vercel.post(
                    `/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain}/verify`
                );

                verification = verifyResponse.data;
            } catch (err) {
                verification = err.response?.data || null;
            }
        }

        return res.status(200).json({
            success: true,
            configured: !configResponse.data.misconfigured,
            domain: domainResponse.data,
            verification,
        });
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            success: false,
            message:
                error.response?.data?.error?.message ||
                error.response?.data?.message ||
                error.message,
        });
    }
};

// ===============================
// Delete Domain
// ===============================
const deleteDomainHandler = async (req, res) => {
    try {
        const { domain } = req.query;

        if (!domain) {
            return res.status(400).json({
                success: false,
                message: "Domain is required.",
            });
        }

        await vercel.delete(
            `/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain}`
        );

        return res.status(200).json({
            success: true,
            message: "Domain deleted successfully.",
        });
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            success: false,
            message:
                error.response?.data?.error?.message ||
                error.response?.data?.message ||
                error.message,
        });
    }
};

module.exports = {
    getInfo,
    addDomainHandler,
    getDomainHandler,
    verifyDomainHandler,
    deleteDomainHandler,
};