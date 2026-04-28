const createError = require('http-errors')
const _ = require("lodash")
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');
const { shopID, Idd, generateBillSno, generateBarcode, update_c_report_setting, update_c_report, amt_update_c_report, getTotalAmountByBarcode, generateCommission, generateInvoiceNo } = require('../helpers/helper_function');
const axios = require('axios');
const Joi = require('joi');
var moment = require("moment");

function generate10DigitNumber() {
    return Math.floor(1000000000 + Math.random() * 9000000000);
}

const billMasterSchema = Joi.object({
    ID: Joi.any().allow(null),
    CompanyID: Joi.required(),
    UserID: Joi.string().required(),
    Quantity: Joi.number().integer().min(1).required(),
    SubTotal: Joi.number().min(0).required(),
    TotalAmount: Joi.number().min(0).required(),
    ShipmentRate: Joi.number().min(0).required(),
    PaymentTransactionId: Joi.string().required(),
    PaymentReceipt: Joi.string().required(),
}).unknown(true); // allow extra fields

const billDetailSchema = Joi.array().items(
    Joi.object({
        CompanyID: Joi.required(),
        addToCartID: Joi.number().min(0).required(),
        PublishCode: Joi.string().required(),
        SalePrice: Joi.number().min(0).required(),
        OfferPrice: Joi.number().min(0).required(),
        Quantity: Joi.number().integer().min(1).required(),
        TotalAmonut: Joi.number().min(0).required(),
        Description: Joi.string().allow("", null),
        Gender: Joi.string().allow("", null),
        power: Joi.alternatives().try(
            Joi.string().allow("", null),
            Joi.array()
        )
    }).unknown(true) // allow extra fields inside each item
);

async function formatTimestamp(input) {
    // Return as-is if input is explicitly the zero-date
    if (input === '0000-00-00 00:00:00') {
        return '0000-00-00 00:00:00';
    }

    // Check if input contains AM or PM
    const is12HourFormat = /AM|PM/i.test(input);

    let date = is12HourFormat ? new Date(input) : new Date(input.replace(' ', 'T'));

    if (isNaN(date.getTime())) {
        return '0000-00-00 00:00:00'; // Fallback for any invalid input
    }

    // Format to YYYY-MM-DD HH:mm:ss
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
}

async function getSubdomain(url) {
    try {
        const hostname = new URL(url).hostname;

        // Handle localhost
        if (hostname === 'localhost') return null;

        // Handle IP address
        if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null;

        const parts = hostname.split('.');

        // Handle normal domains
        if (parts.length > 2) {
            return parts[0];
        }

        return null;
    } catch (error) {
        return null;
    }
}

module.exports = {
    save: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" };

            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            const LoggedOnUser = req.user?.ID || 0;
            const CompanyID = req.user?.CompanyID || 0;

            // ✅ Secure ShopID from headers
            let ShopID = 0;
            try {
                ShopID = Number(await shopID(req.headers)) || 0;
            } catch {
                ShopID = 0;
            }

            // ✅ Shop validation
            if (ShopID === 0) {
                return res.send({
                    success: false,
                    data: null,
                    message: "Invalid Shop. Please select a shop before saving product."
                });
            }

            const {
                ID,
                ProductTypeID,
                ProductTypeName,
                ProductName,
                SalePrice,
                OfferPrice,
                Quantity,
                Status,
                IsPublished,
                IsOutOfStock,
                PublishCode,
                Images,
                Description,
                Gender,
                ProductNameArray
            } = req.body;

            // ✅ Basic validation
            if (!ProductName || ProductName.trim() === "") {
                return res.send({ success: false, message: "Product name is required" });
            }
            if (SalePrice === undefined || isNaN(SalePrice) || Number(SalePrice) < 0) {
                return res.send({ success: false, message: "Invalid Sale Price" });
            }
            if (OfferPrice !== undefined && (isNaN(OfferPrice) || Number(OfferPrice) < 0)) {
                return res.send({ success: false, message: "Invalid Offer Price" });
            }
            if (Quantity === undefined || isNaN(Quantity) || Number(Quantity) < 0) {
                return res.send({ success: false, message: "Invalid Quantity" });
            }

            // ✅ Check for duplicates
            const duplicateQuery = `
            SELECT ID FROM ecom_product
            WHERE CompanyID = ? AND ShopID = ? AND ProductTypeID = ? 
              AND ProductTypeName = ? AND ProductName = ? 
              AND SalePrice = ? AND OfferPrice = ? 
              ${ID ? "AND ID != ?" : ""}
            LIMIT 1
        `;
            const params = [CompanyID, ShopID, ProductTypeID, ProductTypeName, ProductName, SalePrice, OfferPrice];
            if (ID) params.push(ID);

            const [dupRows] = await connection.query(duplicateQuery, params);

            if (dupRows.length > 0) {
                return res.send({
                    success: false,
                    message: "Product with same type, name, and price already exists in this shop."
                });
            }

            /** ===============================
             * INSERT
             =============================== */
            if (!ID || ID === 0) {
                const finalPublishCode = PublishCode || generate10DigitNumber();
                const insertQuery = `
                INSERT INTO ecom_product (
                    CompanyID,
                    ShopID,
                    ProductTypeID,
                    ProductTypeName,
                    ProductName,
                    SalePrice,
                    OfferPrice,
                    Quantity,
                    Status,
                    IsPublished,
                    IsOutOfStock,
                    PublishCode,
                    Images,
                    Description,
                    Gender,
                    CreatedBy,
                    ProductNameArray,
                    CreatedOn,
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
            `;

                const [result] = await connection.query(insertQuery, [
                    CompanyID,
                    ShopID,
                    ProductTypeID,
                    ProductTypeName,
                    ProductName,
                    SalePrice,
                    OfferPrice,
                    Quantity,
                    Status,
                    IsPublished,
                    IsOutOfStock,
                    finalPublishCode,
                    JSON.stringify(Images || []),
                    Description,
                    Gender,
                    LoggedOnUser,
                    ProductNameArray
                ]);

                response.message = "Product saved successfully";
                response.data = { ID: result.insertId };
            }

            /** ===============================
             * UPDATE
             =============================== */
            else {
                const updateQuery = `
                UPDATE ecom_product SET
                    ProductTypeID = ?,
                    ProductTypeName = ?,
                    ProductName = ?,
                    SalePrice = ?,
                    OfferPrice = ?,
                    Quantity = ?,
                    Status = ?,
                    IsPublished = ?,
                    IsOutOfStock = ?,
                    Images = ?,
                    Description = ?,
                    Gender = ?,
                    UpdatedBy = ?,
                    ProductNameArray = ?,
                    UpdatedOn = NOW()
                WHERE ID = ? AND CompanyID = ? AND ShopID = ?
            `;

                await connection.query(updateQuery, [
                    ProductTypeID,
                    ProductTypeName,
                    ProductName,
                    SalePrice,
                    OfferPrice,
                    Quantity,
                    Status,
                    IsPublished,
                    IsOutOfStock,
                    JSON.stringify(Images || []),
                    Description,
                    Gender,
                    LoggedOnUser,
                    ProductNameArray,
                    ID,
                    CompanyID,
                    ShopID
                ]);

                response.message = "Product updated successfully";
                response.data = { ID };
            }

            return res.send(response);

        } catch (err) {
            next(err);
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
    getList: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" };

            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            const CompanyID = req.user?.CompanyID || 0;

            /** ===============================
             * Get ShopID from Headers
             =============================== */
            let ShopID = 0;
            try {
                ShopID = Number(await shopID(req.headers)) || 0;
            } catch (err) {
                ShopID = 0;
            }

            /** ===============================
             * Shop Validation
             =============================== */
            if (ShopID === 0) {
                return res.send({
                    success: false,
                    data: null,
                    message: "Invalid Shop. Please select a shop."
                });
            }

            /** ===============================
             * Fetch Products (Latest First)
             =============================== */
            const selectQuery = `
            SELECT
                ID,
                CompanyID,
                ShopID,
                ProductTypeID,
                ProductTypeName,
                ProductName,
                SalePrice,
                OfferPrice,
                Quantity,
                Status,
                IsPublished,
                IsOutOfStock,
                PublishCode,
                Images,
                Description,
                ProductNameArray,
                Gender,
                CreatedBy,
                CreatedOn,
                UpdatedBy,
                UpdatedOn
            FROM ecom_product
            WHERE CompanyID = ? AND ShopID = ?
            ORDER BY CreatedOn DESC
        `;

            const [rows] = await connection.query(selectQuery, [
                CompanyID,
                ShopID
            ]);

            /** ===============================
             * No Data Found
             =============================== */
            if (!rows || rows.length === 0) {
                return res.send({
                    success: false,
                    data: [],
                    message: "Product not found"
                });
            }

            /** ===============================
             * Parse Images JSON Safely
             =============================== */
            const products = rows.map(product => {
                try {
                    product.Images = product.Images
                        ? JSON.parse(product.Images)
                        : [];
                } catch (err) {
                    product.Images = [];
                }
                return product;
            });

            response.data = products;
            response.message = "Product list fetched successfully";

            return res.send(response);

        } catch (err) {
            next(err);
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
    getDataByID: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" };

            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            const CompanyID = req.user?.CompanyID || 0;

            // ✅ Secure ShopID from headers
            let ShopID = 0;
            try {
                ShopID = Number(await shopID(req.headers)) || 0;
            } catch {
                ShopID = 0;
            }

            /** ===============================
             * Shop Validation
             =============================== */
            if (ShopID === 0) {
                return res.send({
                    success: false,
                    data: null,
                    message: "Invalid Shop. Please select a shop."
                });
            }

            const { ID } = req.body;

            /** ===============================
             * ID Validation
             =============================== */
            if (!ID || isNaN(ID)) {
                return res.send({
                    success: false,
                    data: null,
                    message: "Invalid product ID"
                });
            }

            /** ===============================
             * Fetch Product
             =============================== */
            const selectQuery = `
            SELECT
                ID,
                CompanyID,
                ShopID,
                ProductTypeID,
                ProductTypeName,
                ProductName,
                SalePrice,
                OfferPrice,
                Quantity,
                Status,
                IsPublished,
                IsOutOfStock,
                PublishCode,
                Images,
                Description,
                ProductNameArray,
                Gender,
                CreatedBy,
                CreatedOn,
                UpdatedBy,
                UpdatedOn
            FROM ecom_product
            WHERE ID = ? AND CompanyID = ? AND ShopID = ?
            LIMIT 1
        `;

            const [rows] = await connection.query(selectQuery, [
                ID,
                CompanyID,
                ShopID
            ]);

            if (rows.length === 0) {
                return res.send({
                    success: false,
                    data: null,
                    message: "Product not found"
                });
            }

            // ✅ Parse Images JSON safely
            const product = rows[0];
            try {
                product.Images = product.Images ? JSON.parse(product.Images) : [];
            } catch {
                product.Images = [];
            }

            response.data = product;
            response.message = "Product details fetched successfully";

            return res.send(response);

        } catch (err) {
            next(err);
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
    getProductForWebSite: async (req, res, next) => {
        let connection;
        try {
            const response = { data: {}, success: true, message: "" };
            const CompanyID = 341;

            /** ===============================
             * DB Connection
             =============================== */
            const db = await dbConfig.dbByCompanyID(CompanyID);
            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            /** ===============================
             * 1️⃣ Fetch Product Types
             =============================== */
            const [productTypeRows] = await connection.query(
                `SELECT Name AS ProductType FROM product WHERE Status = 1 AND CompanyID = ?`,
                [CompanyID]
            );

            // If no product types exist
            if (!productTypeRows || productTypeRows.length === 0) {
                response.success = false
                response.message = "No product types found";
                return res.send(response);
            }

            // Initialize types with empty arrays
            productTypeRows.forEach(type => {
                const typeName = type.ProductType?.trim();
                if (typeName) {
                    response.data[typeName] = [];
                }
            });

            // Always keep fallback bucket
            response.data["Others"] = [];

            /** ===============================
             * 2️⃣ Fetch Products
             =============================== */
            const [rows] = await connection.query(
                `SELECT
                ID,
                ProductTypeID,
                ProductTypeName,
                ProductName,
                SalePrice,
                OfferPrice,
                Quantity,
                Status,
                IsPublished,
                IsOutOfStock,
                PublishCode,
                Images,
                Description,
                ProductNameArray,
                Gender,
                CreatedBy,
                CreatedOn,
                UpdatedBy,
                UpdatedOn
            FROM ecom_product
            WHERE IsPublished = 1 AND Status = 1 AND CompanyID = ?`,
                [CompanyID]
            );

            /** ===============================
             * 3️⃣ Map Products to Types (Safe)
             =============================== */
            rows.forEach(product => {
                try {
                    product.Images = product.Images ? JSON.parse(product.Images) : [];
                } catch {
                    product.Images = [];
                }

                const typeName = product.ProductTypeName?.trim();

                if (typeName && response.data[typeName]) {
                    response.data[typeName].push(product);
                } else {
                    // Handle non-existing product type
                    response.data["Others"].push(product);
                }
            });

            response.message = "Products fetched successfully";
            return res.send(response);

        } catch (err) {
            next(err);
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
    getProductForWebSiteFilter: async (req, res, next) => {
        let connection;
        try {
            const response = { data: {}, success: true, message: "" };
            const CompanyID = 341;

            // ✅ Filters from request
            const { Gender, ProductTypeName } = req.body;

            /** ===============================
             * DB Connection
             =============================== */
            const db = await dbConfig.dbByCompanyID(CompanyID);
            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            /** ===============================
             * 1️⃣ Fetch Product Types
             =============================== */
            const [productTypeRows] = await connection.query(
                `SELECT Name AS ProductType 
             FROM product 
             WHERE Status = 1 AND CompanyID = ?`,
                [CompanyID]
            );

            if (!productTypeRows.length) {
                return res.send({
                    success: false,
                    message: "No product types found",
                    data: {}
                });
            }

            // Initialize response buckets
            productTypeRows.forEach(t => {
                const name = t.ProductType?.trim();
                if (name) response.data[name] = [];
            });
            response.data["Others"] = [];

            /** ===============================
             * 2️⃣ Build Dynamic WHERE Clause
             =============================== */
            let whereClause = `
            WHERE IsPublished = 1 
            AND Status = 1 
            AND CompanyID = ?
        `;

            const params = [CompanyID];

            if (Gender) {
                whereClause += ` AND Gender = ?`;
                params.push(Gender);
            }

            if (ProductTypeName) {
                whereClause += ` AND ProductTypeName = ?`;
                params.push(ProductTypeName);
            }

            /** ===============================
             * 3️⃣ Fetch Products
             =============================== */
            const [rows] = await connection.query(
                `
            SELECT
                ID,
                ProductTypeID,
                ProductTypeName,
                ProductName,
                SalePrice,
                OfferPrice,
                Quantity,
                Status,
                IsPublished,
                IsOutOfStock,
                PublishCode,
                Images,
                Description,
                ProductNameArray,
                Gender,
                CreatedBy,
                CreatedOn,
                UpdatedBy,
                UpdatedOn
            FROM ecom_product
            ${whereClause}
            `,
                params
            );

            /** ===============================
             * 4️⃣ Map Products to Types
             =============================== */
            rows.forEach(product => {
                try {
                    product.Images = product.Images ? JSON.parse(product.Images) : [];
                } catch {
                    product.Images = [];
                }

                const typeName = product.ProductTypeName?.trim();

                if (typeName && response.data[typeName]) {
                    response.data[typeName].push(product);
                } else {
                    response.data["Others"].push(product);
                }
            });

            response.message = "Products fetched successfully";
            return res.send(response);

        } catch (err) {
            next(err);
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
    getDataByPincode: async (req, res, next) => {
        let connection;
        try {
            const CompanyID = 341;
            let { pincode } = req.params;
            pincode = pincode.replace(/[^0-9]/g, '');
            // validation
            if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid pincode",
                });
            }

            /** ===============================
             * DB Connection
             =============================== */
            const db = await dbConfig.dbByCompanyID(CompanyID);
            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            /** ===============================
             * Pincode API
             =============================== */
            const ApiRes = await axios.get(
                `https://api.postalpincode.in/pincode/${pincode}`
            );

            const data = ApiRes.data;

            if (!data || data[0].Status !== "Success" || !data[0].PostOffice.length) {
                return res.status(404).json({
                    success: false,
                    message: "Pincode not found",
                });
            }

            /** ===============================
             * Company Address
             =============================== */
            const [fetchCompanyAddress] = await connection.query(`SELECT State, City FROM company WHERE ID = ?`, [CompanyID]);

            /** ===============================
             * Shipment Rates (YOUR STRUCTURE)
             =============================== */
            const [shipmentRates] = await connection.query(`SELECT IsSameCity, IsSameState, IsOtherState FROM ecom_shipment_rate WHERE CompanyID = ?`, [CompanyID]);

            const rate = shipmentRates.length
                ? shipmentRates[0]
                : { IsSameCity: 0, IsSameState: 0, IsOtherState: 0 };

            const postOffices = data[0].PostOffice || [];
            let updatedPostOffices = postOffices;

            if (fetchCompanyAddress.length) {
                const { State, City } = fetchCompanyAddress[0];

                updatedPostOffices = postOffices.map(po => {
                    const { Description, ...cleanPo } = po;

                    const poCity = po.Block || po.Name;
                    const poState = po.State;

                    const isSameState =
                        State &&
                        poState &&
                        State.toLowerCase() === poState.toLowerCase();

                    const isSameCity =
                        isSameState &&
                        City &&
                        poCity &&
                        City.toLowerCase() === poCity.toLowerCase();

                    let shipmentRate = rate.IsOtherState;

                    if (isSameCity) shipmentRate = rate.IsSameCity;
                    else if (isSameState) shipmentRate = rate.IsSameState;

                    return {
                        ...cleanPo,
                        IsSameCity: isSameCity,
                        IsSameState: isSameState && !isSameCity,
                        IsOtherState: !isSameState,
                        ShipmentRate: shipmentRate
                    };
                });
            }

            /** ===============================
             * Response
             =============================== */
            return res.status(200).json({
                success: true,
                message: "Data fetched successfully",
                data: updatedPostOffices
            });

        } catch (err) {
            next(err);
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
    saveOrUpdateShipmentRate: async (req, res, next) => {
        let connection;
        try {
            const { IsSameCity, IsSameState, IsOtherState } = req.body;

            const LoggedOnUser = req.user?.ID || 0;
            const CompanyID = req.user?.CompanyID || 0;

            if (!CompanyID) {
                return res.status(400).json({
                    success: false,
                    message: "CompanyID is required"
                });
            }

            if (
                IsSameCity === undefined ||
                IsSameState === undefined ||
                IsOtherState === undefined ||
                isNaN(Number(IsSameCity)) ||
                isNaN(Number(IsSameState)) ||
                isNaN(Number(IsOtherState))
            ) {
                return res.status(200).json({
                    success: false,
                    message: "All shipment rate fields are required and must be valid numbers"
                });
            }

            /** ===============================
             * DB Connection
             =============================== */
            const db = await dbConfig.dbByCompanyID(CompanyID);
            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            // check if record exists
            const [existing] = await connection.query(`SELECT CompanyID FROM ecom_shipment_rate WHERE CompanyID = ?`, [CompanyID]);

            if (existing.length > 0) {
                // update
                const [result] = await connection.query(`UPDATE ecom_shipment_rate SET IsSameCity = ?, IsSameState = ?, IsOtherState = ? WHERE CompanyID = ?`, [IsSameCity, IsSameState, IsOtherState, CompanyID]);

                return res.json({
                    success: true,
                    message: result.affectedRows ? "Shipment rate updated successfully" : "No changes made"
                });
            } else {
                // insert
                await connection.query(`INSERT INTO ecom_shipment_rate (CompanyID, IsSameCity, IsSameState, IsOtherState) VALUES (?, ?, ?, ?)`, [CompanyID, IsSameCity, IsSameState, IsOtherState]);

                return res.json({
                    success: true,
                    message: "Shipment rate saved successfully"
                });
            }

        } catch (error) {
            console.error("saveOrUpdateShipmentRate Error:", error);
            return res.status(500).json({
                success: false,
                message: "Error while saving shipment rate"
            });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
    getShipmentRate: async (req, res, next) => {
        let connection;
        try {

            const CompanyID = req.user?.CompanyID || 0;

            let query = `SELECT CompanyID,IsSameCity,IsSameState, IsOtherState FROM ecom_shipment_rate`;

            const params = [];

            // If CompanyID is provided → fetch single record
            if (CompanyID) {
                query += ` WHERE CompanyID = ?`;
                params.push(CompanyID);
            }

            /** ===============================
             * DB Connection
             =============================== */
            const db = await dbConfig.dbByCompanyID(CompanyID);
            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            const [rows] = await connection.query(query, params);

            if (CompanyID && rows.length === 0) {
                return res.status(200).json({
                    success: false,
                    message: "Shipment rate not found"
                });
            }

            return res.status(200).json({
                success: true,
                data: CompanyID ? rows[0] : rows
            });

        } catch (error) {
            console.error("getShipmentRate Error:", error);
            return res.status(500).json({
                success: false,
                message: "Error while fetching shipment rates"
            });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
    signup: async (req, res, next) => {
        let connection;
        try {
            const {
                Title,
                Name,
                MobileNo,
                AltMobileNo,
                DOB,
                Email,
                Pincode,
                City,
                State,
                Country,
                Address,
                LoginName,
                Password,
                CreatedBy = 1,
                UpdatedBy = 1
            } = req.body;

            const CompanyID = 341;

            if (!CompanyID || !Name || !MobileNo || !LoginName || !Password) {
                return res.status(200).json({
                    success: false,
                    message: "Required fields are missing"
                });
            }

            /* ---------- CHECK EXISTING USER (UPDATED) ---------- */
            const conditions = [];
            const params = [];

            if (Email) {
                conditions.push("Email = ?");
                params.push(Email.trim());
            }

            if (LoginName) {
                conditions.push("LoginName = ?");
                params.push(LoginName.trim());
            }

            if (MobileNo) {
                conditions.push("MobileNo = ?");
                params.push(MobileNo.trim());
            }


            if (!conditions.length) {
                return res.status(200).json({
                    success: false,
                    message: "Email or LoginName or MobileNo is required"
                });
            }

            /* =============================== EMAIL VALIDATION =============================== */
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(Email)) {
                return res.status(200).json({
                    success: false,
                    message: "Invalid email format"
                });
            }

            /* =============================== MOBILE NUMBER VALIDATION (10 digit, cannot start with 0) =============================== */
            const mobileRegex = /^[6-9]\d{9}$/;
            if (!mobileRegex.test(MobileNo)) {
                return res.status(200).json({
                    success: false,
                    message: "Invalid mobile number"
                });
            }

            if (AltMobileNo && !mobileRegex.test(AltMobileNo)) {
                return res.status(200).json({
                    success: false,
                    message: "Invalid alternate mobile number"
                });
            }

            /* =============================== LOGINNAME VALIDATION =============================== */
            if (!LoginName || LoginName.trim().length < 4) {
                return res.status(200).json({
                    success: false,
                    message: "LoginName must be at least 4 characters long"
                });
            }

            if (/\s/.test(LoginName)) {
                return res.status(200).json({
                    success: false,
                    message: "LoginName should not contain spaces"
                });
            }

            /* =============================== PASSWORD VALIDATION =============================== */
            if (!Password || Password.length < 6) {
                return res.status(200).json({
                    success: false,
                    message: "Password must be at least 6 characters long"
                });
            }

            if (/\s/.test(Password)) {
                return res.status(200).json({
                    success: false,
                    message: "Password should not contain spaces"
                });
            }

            /** ===============================
             * DB Connection
             =============================== */
            const db = await dbConfig.dbByCompanyID(CompanyID);
            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            const [existingUser] = await connection.query(`SELECT UserID FROM ecom_user WHERE ${conditions.join(" OR ")}`, params);

            if (existingUser.length) {
                return res.status(200).json({
                    success: false,
                    message: "User already exists with Email / LoginName / MobileNo"
                });
            }

            /* ---------- CREATE USER ---------- */
            const UserID = Math.floor(1000000000 + Math.random() * 9000000000);

            await connection.query(`INSERT INTO ecom_user (CompanyID, UserID, Title, Name, MobileNo, AltMobileNo,DOB, Email, Pincode, City, State, Country, Address,LoginName, Password, Status, CreatedBy, UpdatedBy, CreatedOn ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NOW())`,
                [
                    CompanyID,
                    UserID,
                    Title || "",
                    Name,
                    MobileNo,
                    AltMobileNo || "",
                    DOB || "0000-00-00",
                    Email || "",
                    Pincode || "",
                    City || "",
                    State || "",
                    Country || "",
                    Address || "",
                    LoginName,
                    Password,
                    CreatedBy,
                    UpdatedBy
                ]
            );

            return res.status(200).json({
                success: true,
                message: "User registered successfully",
                UserID
            });

        } catch (error) {
            console.error("Signup Error:", error);
            return res.status(500).json({
                success: false,
                message: "Error while creating user"
            });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
    login: async (req, res, next) => {
        let connection;
        try {
            const { username, password } = req.body;

            const CompanyID = 341;

            if (!username || !password) {
                return res.status(200).json({
                    success: false,
                    message: "Username and password are required"
                });
            }

            /* ===============================
               DB Connection
            =============================== */
            const db = await dbConfig.dbByCompanyID(CompanyID);
            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            /* ===============================
               LOGIN QUERY (ALL COLUMNS)
            =============================== */
            const [user] = await connection.query(
                `SELECT * FROM ecom_user WHERE CompanyID = ? AND (LoginName = ? OR Email = ? OR MobileNo = ?) AND Password = ? AND Status = 1 LIMIT 1`,
                [
                    CompanyID,
                    username.trim(),
                    username.trim(),
                    username.trim(),
                    password
                ]
            );

            if (!user.length) {
                return res.status(200).json({
                    success: false,
                    message: "Invalid credentials or inactive user"
                });
            }

            const [fetchEcomPaymentQr] = await connection.query(`select EcomPaymentQr from companysetting where CompanyID = ${CompanyID}`);

            return res.status(200).json({
                success: true,
                message: "Login successful",
                data: user[0],   // full row returned
                paymentQr: fetchEcomPaymentQr[0]?.EcomPaymentQr || ""
            });

        } catch (error) {
            console.error("Login Error:", error);
            return res.status(500).json({
                success: false,
                message: "Error while login"
            });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },
    getUserDataByID: async (req, res, next) => {
        let connection;
        try {
            const { UserID } = req.query; // or req.params

            const CompanyID = 341;

            if (!UserID) {
                return res.status(200).json({
                    success: false,
                    message: "UserID is required"
                });
            }

            /* ===============================
               DB Connection
            =============================== */
            const db = await dbConfig.dbByCompanyID(CompanyID);
            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            /* ===============================
               FETCH USER BY ID
            =============================== */
            const [user] = await connection.query(`SELECT * FROM ecom_user WHERE CompanyID = ? AND UserID = ? LIMIT 1`, [CompanyID, UserID]);

            if (!user.length) {
                return res.status(200).json({
                    success: false,
                    message: "User not found"
                });
            }

            // fetch add to cart data

            const [cartData] = await connection.query(`select ecom_addtocart.ID,ecom_addtocart.Quantity, ecom_product.ProductTypeID,ecom_product.ProductTypeName,ecom_product.ProductName,ecom_product.SalePrice,ecom_product.OfferPrice,ecom_product.IsPublished,ecom_product.IsOutOfStock,ecom_product.PublishCode,ecom_product.Images,ecom_product.Description,ecom_product.ProductNameArray,ecom_product.Gender,ecom_product.CreatedBy,ecom_product.CreatedOn,ecom_product.UpdatedBy,ecom_product.UpdatedOn from ecom_addtocart left join ecom_product on ecom_product.PublishCode = ecom_addtocart.PublishCode where ecom_addtocart.CompanyID = ${user[0].CompanyID} and ecom_addtocart.Status = 1 and ecom_addtocart.UserID = ${user[0].UserID}`);

            const [orderData] = await connection.query(`SELECT ecom_billmaster.*, ecom_user.Title, ecom_user.Name, ecom_user.MobileNo, ecom_user.AltMobileNo, ecom_user.City, ecom_user.State, ecom_user.Country, ecom_user.Address FROM ecom_billmaster LEFT JOIN ecom_user ON ecom_user.UserID = ecom_billmaster.UserID and ecom_billmaster.CompanyID = ${user[0].CompanyID} and ecom_billmaster.UserID = ${user[0].UserID}`);

            return res.status(200).json({
                success: true,
                message: "User data fetched successfully",
                data: user[0],
                cartData: cartData || [],
                orderData: orderData || []
            });

        } catch (error) {
            console.error("getUserDataByID Error:", error);
            return res.status(500).json({
                success: false,
                message: "Error while fetching user data"
            });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },

    // add to cart
    manageCart: async (req, res) => {
        let connection;
        try {
            const { CompanyID, UserID, PublishCode, Quantity, action } = req.body;

            if (!CompanyID || !UserID || !PublishCode || !action) {
                return res.status(400).json({
                    success: false,
                    message: "Required fields missing"
                });
            }

            /* ===============================
             DB Connection
          =============================== */
            const db = await dbConfig.dbByCompanyID(CompanyID);
            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            await connection.beginTransaction();

            // ✅ Check user exists
            const [user] = await connection.query(`SELECT ID FROM ecom_user WHERE UserID = ? AND Status = 1 LIMIT 1`, [UserID]);

            if (!user.length) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: "UserID does not exist"
                });
            }

            // Lock row to prevent race condition
            const [existing] = await connection.query(`SELECT * FROM ecom_addtocart WHERE CompanyID = ? AND UserID = ? AND PublishCode = ? AND Status = 1`, [CompanyID, UserID, PublishCode]);

            // ================= ADD =================
            if (action === "add") {

                if (!Quantity || Quantity <= 0) {
                    await connection.rollback();
                    return res.status(400).json({
                        success: false,
                        message: "Quantity must be greater than 0"
                    });
                }

                if (existing.length > 0) {

                    await connection.query(`UPDATE ecom_addtocart SET Quantity = ?, UpdatedOn = NOW() WHERE ID = ?`, [Quantity, existing[0].ID]);

                } else {

                    await connection.query(`INSERT INTO ecom_addtocart(CompanyID, UserID, PublishCode, Quantity, Status, CreatedOn, UpdatedOn) VALUES (?, ?, ?, ?, 1, NOW(), NOW())`, [CompanyID, UserID, PublishCode, Quantity]);
                }

                await connection.commit();

                return res.json({
                    success: true,
                    message: "Cart updated successfully"
                });
            }

            // ================= UPDATE =================
            if (action === "update") {

                if (!existing.length) {
                    await connection.rollback();
                    return res.status(404).json({
                        success: false,
                        message: "Item not found in cart"
                    });
                }

                if (!Quantity || Quantity <= 0) {
                    await connection.rollback();
                    return res.status(400).json({
                        success: false,
                        message: "Quantity must be greater than 0"
                    });
                }

                await connection.query(`UPDATE ecom_addtocart SET Quantity = ?, UpdatedOn = NOW() WHERE ID = ?`, [Quantity, existing[0].ID]);

                await connection.commit();

                return res.json({
                    success: true,
                    message: "Cart quantity updated"
                });
            }

            // ================= DELETE =================
            if (action === "delete") {

                if (!existing.length) {
                    await connection.rollback();
                    return res.status(404).json({
                        success: false,
                        message: "Item not found"
                    });
                }

                await connection.query(`UPDATE ecom_addtocart SET Status = 0, UpdatedOn = NOW() WHERE ID = ?`, [existing[0].ID]);

                await connection.commit();

                return res.json({
                    success: true,
                    message: "Item removed from cart"
                });
            }

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Invalid action"
            });

        } catch (error) {

            if (connection) await connection.rollback();

            console.error("manageCart Error:", error);

            return res.status(500).json({
                success: false,
                message: "Error while manageCart"
            });

        } finally {
            if (connection) connection.release();
        }
    },

    // save order

    saveOrder: async (req, res) => {
        let connection;
        try {
            const { billMaseterData, billDetailData } = req.body;

            /* ===============================
               Validate Bill Master
            =============================== */

            const { error: masterError } = billMasterSchema.validate(billMaseterData);

            if (masterError) {
                return res.status(400).json({
                    success: false,
                    message: masterError.details[0].message
                });
            }

            /* ===============================
               Validate Bill Detail
            =============================== */

            const { error: detailError } = billDetailSchema.validate(billDetailData, { abortEarly: false });

            if (detailError) {
                return res.status(400).json({
                    success: false,
                    message: detailError.details.map(err => err.message)
                });
            }

            if (!Array.isArray(billDetailData) || billDetailData.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Bill detail data required"
                });
            }

            const { CompanyID, UserID, Quantity, SubTotal, ShipmentRate, TotalAmount, PaymentTransactionId, PaymentReceipt } = billMaseterData;

            const OrderNo = Math.floor(1000000000 + Math.random() * 9000000000);


            /* ===============================
               DB Connection
            =============================== */

            const db = await dbConfig.dbByCompanyID(CompanyID);
            if (db.success === false) {
                return res.status(400).json(db);
            }

            connection = await db.getConnection();

            await connection.beginTransaction();

            /* ===============================
               Check User Exists
            =============================== */

            const [user] = await connection.query(`SELECT ID FROM ecom_user WHERE UserID = ? AND Status = 1 LIMIT 1`, [UserID]);

            if (!user.length) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: "UserID does not exist"
                });

            }

            /* ===============================
               Insert Bill Master
            =============================== */

            const [billMasterResult] = await connection.query(`INSERT INTO ecom_billmaster (CompanyID, UserID, OrderNo, Quantity, Status, OrderStatus, SubTotal, ShipmentRate, TotalAmount, CreatedOn, UpdatedOn, PaymentTransactionId, PaymentReceipt) VALUES (?, ?, ?, ?, ?, ?, ?,?,?, NOW(), NOW(), ?, ?)`, [CompanyID, UserID, OrderNo, Quantity, 1, "Pending", SubTotal, ShipmentRate, TotalAmount, PaymentTransactionId, PaymentReceipt]);

            const billMasterID = billMasterResult.insertId;

            /* ===============================
               Insert Bill Details
            =============================== */

            const cartIDs = [];

            for (const item of billDetailData) {

                const { addToCartID, PublishCode, SalePrice, OfferPrice, Quantity: itemQuantity, TotalAmonut, Description, Gender, power } = item;

                await connection.query(`INSERT INTO ecom_billdetail (BillMasterID, CompanyID, addToCartID, PublishCode, SalePrice, OfferPrice, Quantity, TotalAmonut, Status, Description, Gender, power, CreatedOn, UpdatedOn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`, [billMasterID, CompanyID, addToCartID || 0, PublishCode, SalePrice, OfferPrice, itemQuantity, TotalAmonut, 1, Description || null, Gender || null, power ? JSON.stringify(power) : null]);

                /* ===============================
                   Collect Cart IDs
                =============================== */

                if (Number(addToCartID) > 0) {
                    cartIDs.push(addToCartID);
                }

            }

            /* ===============================
               Update Cart Items
            =============================== */

            if (cartIDs.length > 0) {
                await connection.query(`UPDATE ecom_addtocart SET Status = 0, UpdatedOn = NOW() WHERE ID IN (?)`, [cartIDs]);
            }

            /* ===============================
               Commit Transaction
            =============================== */

            await connection.commit();

            return res.status(200).json({
                success: true,
                message: "Order saved successfully",
                billMasterID
            });

        } catch (error) {

            if (connection) await connection.rollback();

            console.error("saveOrder Error:", error);

            return res.status(500).json({
                success: false,
                message: "Error while saving order"
            });

        } finally {

            if (connection) connection.release();

        }

    },
    cancelOrder: async (req, res) => {
        let connection;
        try {

            const { CompanyID, OrderNo, UserID } = req.body;

            if (!CompanyID || !OrderNo || !UserID) {
                return res.status(400).json({
                    success: false,
                    message: "CompanyID, OrderNo and UserID are required"
                });
            }

            /* ===============================
               DB Connection
            =============================== */
            const db = await dbConfig.dbByCompanyID(CompanyID);
            if (db.success === false) {
                return res.status(400).json(db);
            }
            connection = await db.getConnection();
            await connection.beginTransaction();

            /* ===============================
               Check Order
            =============================== */

            const [order] = await connection.query(`SELECT ID, OrderStatus FROM ecom_billmaster WHERE OrderNo = ? AND UserID = ? AND Status = 1 LIMIT 1`, [OrderNo, UserID]);

            if (!order.length) {

                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    message: "Order not found"
                });

            }

            const orderData = order[0];

            /* ===============================
               Allow Cancel Only Pending
            =============================== */

            if (orderData.OrderStatus !== "Pending") {

                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: "Order cannot be cancelled. It is already processed."
                });

            }

            /* ===============================
               Cancel Order
            =============================== */

            await connection.query(`UPDATE ecom_billmaster SET OrderStatus = 'Cancelled', UpdatedOn = NOW() WHERE ID = ?`, [orderData.ID]);

            /* ===============================
               Update Order Items
            =============================== */

            await connection.query(`UPDATE ecom_billdetail SET Status = 0, UpdatedOn = NOW() WHERE BillMasterID = ?`, [orderData.ID]);

            /* ===============================
               Commit
            =============================== */

            await connection.commit();

            return res.status(200).json({
                success: true,
                message: "Order cancelled successfully"
            });

        } catch (error) {
            if (connection) await connection.rollback();
            console.error("cancelOrder Error:", error);
            return res.status(500).json({
                success: false,
                message: "Error while cancelling order"
            });

        } finally {
            if (connection) connection.release();
        }

    },
    returnOrder: async (req, res) => {
        let connection;
        try {

            const { CompanyID, BillMasterID } = req.body;

            if (!CompanyID || !BillMasterID) {
                return res.status(400).json({
                    success: false,
                    message: "CompanyID and BillMasterID required"
                });
            }

            const db = await dbConfig.dbByCompanyID(CompanyID);

            if (db.success === false) {
                return res.status(400).json(db);
            }

            connection = await db.getConnection();

            await connection.beginTransaction();

            /* ===============================
               Check Order
            =============================== */

            const [order] = await connection.query(`SELECT OrderStatus FROM ecom_billmaster WHERE ID = ? AND Status = 1 LIMIT 1`, [BillMasterID]);

            if (!order.length) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: "Order not found"
                });
            }

            if (order[0].OrderStatus !== "Delivered") {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: "Only Delivered orders can be returned"
                });
            }

            /* ===============================
               Update Order Status
            =============================== */

            await connection.query(`UPDATE ecom_billmaster SET OrderStatus = 'Returned', UpdatedOn = NOW() WHERE ID = ?`, [BillMasterID]);

            await connection.commit();

            return res.status(200).json({
                success: true,
                message: "Order returned successfully"
            });

        } catch (error) {
            if (connection) await connection.rollback();
            console.error("returnOrder Error:", error);
            return res.status(500).json({
                success: false,
                message: "Error while returning order"
            });

        } finally {
            if (connection) connection.release();
        }
    },
    getOrderDetail: async (req, res) => {
        let connection;
        try {

            const { CompanyID, BillMasterID, UserID } = req.body;

            if (!CompanyID || !BillMasterID || !UserID) {
                return res.status(400).json({
                    success: false,
                    message: "CompanyID, BillMasterID and UserID required"
                });
            }

            /* ===============================
               DB Connection
            =============================== */

            const db = await dbConfig.dbByCompanyID(CompanyID);

            if (db.success === false) {
                return res.status(400).json(db);
            }

            connection = await db.getConnection();

            /* ===============================
               Get Bill Master (Check UserID)
            =============================== */

            const [billMaster] = await connection.query(`SELECT ecom_billmaster.ID,ecom_billmaster.OrderNo,ecom_billmaster.UserID,ecom_billmaster.Quantity,ecom_billmaster.OrderStatus,ecom_billmaster.SubTotal,ecom_billmaster.ShipmentRate,ecom_billmaster.TotalAmount,ecom_billmaster.CreatedOn, ecom_user.Title, ecom_user.Name, ecom_user.MobileNo, ecom_user.AltMobileNo, ecom_user.City, ecom_user.State, ecom_user.Country, ecom_user.Address FROM ecom_billmaster LEFT JOIN ecom_user ON ecom_user.UserID = ecom_billmaster.UserID WHERE ecom_billmaster.ID = ? AND ecom_billmaster.CompanyID = ? AND ecom_billmaster.UserID = ? AND ecom_billmaster.Status = 1 LIMIT 1`, [BillMasterID, CompanyID, UserID]);

            if (!billMaster.length) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found for this user"
                });
            }

            /* ===============================
               Get Bill Detail Products
            =============================== */

            const [products] = await connection.query(`SELECT ecom_billdetail.ID, ecom_billdetail.addToCartID, ecom_billdetail.PublishCode, ecom_billdetail.SalePrice, ecom_billdetail.OfferPrice, ecom_billdetail.Quantity, ecom_billdetail.TotalAmonut, ecom_billdetail.Description, ecom_billdetail.Gender, ecom_billdetail.power, ecom_product.ProductTypeID,ecom_product.ProductTypeName,ecom_product.ProductName, ecom_product.ProductNameArray FROM ecom_billdetail left join ecom_product on ecom_product.PublishCode = ecom_billdetail.PublishCode WHERE ecom_billdetail.BillMasterID = ? AND ecom_billdetail.CompanyID = ? AND ecom_billdetail.Status = 1`, [BillMasterID, CompanyID]);

            return res.status(200).json({
                success: true,
                billMasterData: billMaster[0],
                billDetailData: products
            });

        } catch (error) {
            console.error("getOrderDetail Error:", error);
            return res.status(500).json({
                success: false,
                message: "Error while fetching order detail"
            });
        } finally {
            if (connection) connection.release();
        }
    },

    // company
    getOrderList: async (req, res) => {
        let connection;
        try {

            const response = { data: null, success: true, message: "" }

            const CompanyID = req.user?.CompanyID || 0
            const shopid = await shopID(req.headers) || 0

            const db = req.db

            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            const Body = req.body;

            if (_.isEmpty(Body)) {
                return res.send({ message: "Invalid Query Data" })
            }

            let page = Body.currentPage || 1
            let limit = Body.itemsPerPage || 10
            let skip = page * limit - limit

            let shopFilter = ``

            if (shopid !== 0) {
                shopFilter = ` AND bm.ShopID = ${shopid}`
            }

            /** ===============================
             * Base Query
            =============================== */

            let qry = `SELECT  bm.ID, bm.OrderNo, bm.Quantity, bm.OrderStatus, bm.SubTotal, bm.ShipmentRate, bm.TotalAmount, DATE_FORMAT(bm.CreatedOn, '%Y-%m-%d') AS CreatedOn, u.Title, u.Name, u.MobileNo, u.AltMobileNo, u.City, u.State, u.Country, u.Address FROM ecom_billmaster bm LEFT JOIN ecom_user u ON u.UserID = bm.UserID AND u.CompanyID = bm.CompanyID WHERE bm.CompanyID = ${CompanyID} AND bm.Status = 1 ORDER BY bm.ID DESC`

            let skipQuery = ` LIMIT ${limit} OFFSET ${skip}`

            let finalQuery = qry + skipQuery

            let [data] = await connection.query(finalQuery)

            let [count] = await connection.query(qry)

            response.message = "Order list fetched successfully"
            response.data = data
            response.count = count.length

            return res.send(response)

        } catch (error) {
            console.error("getOrderList Error:", error);
            return res.status(500).json({
                success: false,
                message: "Error while fetching order data"
            });

        } finally {
            if (connection) connection.release();
        }
    },
    getOrderDetailByID: async (req, res) => {
        let connection;
        try {

            const CompanyID = req.user?.CompanyID || 0
            const shopid = await shopID(req.headers) || 0
            const { BillMasterID } = req.body;

            if (!CompanyID || !BillMasterID) {
                return res.status(400).json({
                    success: false,
                    message: "CompanyID and BillMasterID required"
                });
            }

            /* ===============================
               DB Connection
            =============================== */

            const db = req.db

            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            /* ===============================
               Get Bill Master (Check UserID)
            =============================== */

            const [billMaster] = await connection.query(`SELECT ecom_billmaster.ID,ecom_billmaster.OrderNo,ecom_billmaster.UserID,ecom_billmaster.Quantity,ecom_billmaster.OrderStatus,ecom_billmaster.SubTotal,ecom_billmaster.ShipmentRate,ecom_billmaster.TotalAmount, DATE_FORMAT(ecom_billmaster.CreatedOn, '%Y-%m-%d') AS CreatedOn, ecom_billmaster.PaymentTransactionId, ecom_billmaster.PaymentReceipt, ecom_user.Title, ecom_user.Name, ecom_user.MobileNo, ecom_user.AltMobileNo, ecom_user.City, ecom_user.State, ecom_user.Country, ecom_user.Address FROM ecom_billmaster LEFT JOIN ecom_user ON ecom_user.UserID = ecom_billmaster.UserID WHERE ecom_billmaster.ID = ? AND ecom_billmaster.CompanyID = ? AND ecom_billmaster.Status = 1 LIMIT 1`, [BillMasterID, CompanyID]);

            if (!billMaster.length) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found for this id"
                });
            }

            /* ===============================
               Get Bill Detail Products
            =============================== */

            const [products] = await connection.query(`SELECT ecom_billdetail.ID, ecom_billdetail.addToCartID, ecom_billdetail.PublishCode, ecom_billdetail.SalePrice, ecom_billdetail.OfferPrice, ecom_billdetail.Quantity, ecom_billdetail.TotalAmonut, ecom_billdetail.Description, ecom_billdetail.Gender, ecom_billdetail.power, ecom_product.ProductTypeID,ecom_product.ProductTypeName,ecom_product.ProductName, ecom_product.Images, ecom_product.ProductNameArray FROM ecom_billdetail left join ecom_product on ecom_product.PublishCode = ecom_billdetail.PublishCode WHERE ecom_billdetail.BillMasterID = ? AND ecom_billdetail.CompanyID = ? AND ecom_billdetail.Status = 1`, [BillMasterID, CompanyID]);

            return res.status(200).json({
                success: true,
                billMasterData: billMaster[0],
                billDetailData: products
            });

        } catch (error) {
            console.error("getOrderDetail Error:", error);
            return res.status(500).json({
                success: false,
                message: "Error while fetching order detail"
            });
        } finally {
            if (connection) connection.release();
        }
    },
    orderProcess: async (req, res) => {
        let connection;

        try {
            const CompanyID = req.user?.CompanyID || 0;
            const shopid = await shopID(req.headers) || 0;
            const LoggedOnUser = req.user.ID ? req.user.ID : 0;

            const { BillMaster, BillDetail } = req.body;

            /* ===============================
               ✅ BASIC VALIDATION
            =============================== */

            if (!CompanyID) {
                return res.status(400).json({ success: false, message: "Invalid CompanyID" });
            }

            if (!shopid) {
                return res.status(400).json({ success: false, message: "Invalid ShopID" });
            }

            if (!BillMaster || typeof BillMaster !== "object") {
                return res.status(400).json({ success: false, message: "BillMaster is required" });
            }

            if (!Array.isArray(BillDetail) || BillDetail.length === 0) {
                return res.status(400).json({ success: false, message: "BillDetail must be a non-empty array" });
            }

            /* ===============================
               ✅ BILLMASTER VALIDATION
            =============================== */

            const requiredMasterFields = [
                "OrderNo", "UserID", "Quantity",
                "ShipmentRate", "Name", "MobileNo",
                "City", "State", "Country", "Address",
                "BillDate", "DeliveryDate", "OrderDate"
            ];

            for (const field of requiredMasterFields) {
                if (!BillMaster[field] && BillMaster[field] !== 0) {
                    return res.status(400).json({
                        success: false,
                        message: `BillMaster.${field} is required`
                    });
                }
            }

            if (BillMaster.Quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Quantity"
                });
            }

            /* ===============================
               ✅ BILLDETAIL VALIDATION
            =============================== */

            let totalQty = 0;

            for (let i = 0; i < BillDetail.length; i++) {
                const item = BillDetail[i];

                const requiredDetailFields = [
                    "PublishCode",
                    "SalePrice",
                    "Quantity",
                    "ProductTypeID",
                    "ProductName",
                    "Barcode",                // ✅ added
                    "WholeSale"
                ];

                for (const field of requiredDetailFields) {
                    if (!item[field] && item[field] !== 0) {
                        return res.status(400).json({
                            success: false,
                            message: `BillDetail[${i}].${field} is required`
                        });
                    }
                }

                if (item.Quantity <= 0 || item.SalePrice < 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid data at index ${i}`
                    });
                }

                totalQty += item.Quantity;

                // ✅ power JSON validation
                if (item.power) {
                    try {
                        JSON.parse(item.power);
                    } catch (err) {
                        return res.status(400).json({
                            success: false,
                            message: `Invalid power JSON at index ${i}`
                        });
                    }
                }
            }

            // ✅ Quantity match check only
            if (BillMaster.Quantity !== totalQty) {
                return res.status(400).json({
                    success: false,
                    message: "Quantity mismatch"
                });
            }

            /* ===============================
               ✅ DB CHECK ONLY
            =============================== */

            const db = req.db;

            if (db.success === false) {
                return res.status(200).json(db);
            }

            connection = await db.getConnection();

            const [rows] = await connection.query(
                `SELECT bm.ID, bm.OrderStatus, u.status AS userStatus
             FROM ecom_billmaster bm
             INNER JOIN ecom_user u ON bm.UserID = u.UserID
             WHERE bm.OrderNo = ? 
               AND bm.UserID = ?
             LIMIT 1`,
                [BillMaster.OrderNo, BillMaster.UserID]
            );

            if (!rows || rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Order or User not found"
                });
            }

            const data = rows[0];

            if (data.OrderStatus !== "Pending") {
                return res.status(400).json({
                    success: false,
                    message: `Order status is ${data.OrderStatus}, not allowed`
                });
            }

            if (data.userStatus !== 1) {
                return res.status(400).json({
                    success: false,
                    message: "User is inactive or blocked"
                });
            }

            /* ===============================
               ✅ FINAL RESPONSE (AS REQUIRED)
            =============================== */

            const [user] = await connection.query(`SELECT * FROM ecom_user WHERE UserID = ? AND Status = 1 LIMIT 1`, [BillMaster.UserID]);

            if (!user.length) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: "UserID does not exist"
                });

            }

            let SaveCustomer = false
            let CusInsetedId = 0;
            if (user[0].SaveCustomer === 0) {
                SaveCustomer = true;
            }

            if (SaveCustomer) {

                const [fetchCompanySetting] = await connection.query(`select CustomerShopWise from companysetting where CompanyID = ${CompanyID}`)


                if (fetchCompanySetting[0].CustomerShopWise === 'true' && (shopid === "0" || shopid === 0)) {
                    return res.send({ message: "Invalid shop id, please select shop" });
                }

                const Id = await Idd(req);
                const cust = user[0];
                const customerData = {
                    ShopID: shopid,
                    Idd: Id,
                    Title: cust.Title,
                    Name: cust.Name,
                    Sno: cust.UserID,
                    CompanyID: CompanyID,
                    MobileNo1: cust.MobileNo,
                    MobileNo2: cust.AltMobileNo || cust.MobileNo,
                    PhoneNo: cust.AltMobileNo || cust.MobileNo,
                    Address: cust.Address,
                    GSTNo: "",
                    Email: cust.Email,
                    PhotoURL: "",
                    DOB: cust.DOB,
                    RefferedByDoc: "",
                    Age: 0,
                    Anniversary: "0000-00-00",
                    ReferenceType: "",
                    Gender: "",
                    Other: "",
                    Remarks: "",
                    Status: 1,
                    VisitDate: moment(new Date()).format("YYYY-MM-DD")
                }

                console.log("customerData :", customerData);

                const [customer] = await connection.query(`insert into customer(ShopID,Idd,Title,Name,Sno,CompanyID,MobileNo1,MobileNo2,PhoneNo,Address,GSTNo,Email,PhotoURL,DOB,RefferedByDoc,Age,Anniversary,ReferenceType,Gender,Other,Remarks,Status,CreatedBy,CreatedOn,VisitDate) values(${customerData.ShopID},'${customerData.Idd}','${customerData.Title}', '${customerData.Name}','${customerData.Sno}',${customerData.CompanyID},'${customerData.MobileNo1}','${customerData.MobileNo2}','${customerData.PhoneNo}','${customerData.Address}','${customerData.GSTNo}','${customerData.Email}','${customerData.PhotoURL}','${customerData.DOB}','${customerData.RefferedByDoc}','${customerData.Age}','${customerData.Anniversary}','${customerData.ReferenceType}','${customerData.Gender}','${customerData.Other}','${customerData.Remarks}',1,'${LoggedOnUser}',now(),'${customerData.VisitDate}')`);

                CusInsetedId = customer.insertId

                console.log(connected("Customer Added SuccessFUlly !!!"));

                if (CusInsetedId !== 0) {
                    const [updateUser] = await connection.query(`update ecom_user set SaveCustomer = 1 where UserID = ${BillMaster.UserID}`)
                }

            }

            if (!SaveCustomer && CusInsetedId === 0) {
                const [fetchCus] = await connection.query(`select * from customer where CompanyID = ${CompanyID} and Sno = '${BillMaster.UserID}'`);
                CusInsetedId = fetchCus[0]?.ID || 0;
            }

            console.log("CusInsetedId : ", CusInsetedId);


            if (CusInsetedId === 0) {
                return res.status(200).json({
                    success: false,
                    message: "Customer Not Found"
                });
            }

            let billMaseterData = {
                ...BillMaster,
                Employee: 0,
                Doctor: 0,
                RegNo: "",
                GSTNo: "",
                TrayNo: 0,
                DiscountAmount: 0,
                GSTAmount: 0,
                AddlDiscount: 0,
                RoundOff: 0,
                AddlDiscountPercentage: 0,
                CustomerID: CusInsetedId,
                ShopID: shopid,
                ID: null

            }
            let billDetailData = BillDetail;

            let billingFlow = 1;
            const serialNo = await generateBillSno(CompanyID, shopid,)
            billMaseterData.Sno = serialNo;
            billMaseterData.ShopID = shopid;
            billMaseterData.CompanyID = CompanyID;

            let billType = 1
            let paymentMode = 'Unpaid';
            let productStatus = 'Pending';

            if (billMaseterData.TotalAmount == 0) {
                paymentMode = 'Paid'
            }

            billMaseterData.InvoiceNo = await generateInvoiceNo(CompanyID, shopid, billDetailData, billMaseterData)
            billMaseterData.OrderNo = ""

            console.table({
                BillDate: await formatTimestamp(billMaseterData.OrderDate),
                OrderDate: await formatTimestamp(billMaseterData.OrderDate),
                DeliveryDate: await formatTimestamp(billMaseterData.OrderDate),
            });

            billMaseterData.BillDate = await formatTimestamp(billMaseterData.OrderDate);
            billMaseterData.OrderDate = await formatTimestamp(billMaseterData.OrderDate);
            billMaseterData.DeliveryDate = await formatTimestamp(billMaseterData.OrderDate);

            console.log("billMaseterData : ", billMaseterData);
            console.log("billDetailData : ", billDetailData);


            // save Bill master data

            let [bMaster] = await connection.query(
                `insert into billmaster (CustomerID,CompanyID, Sno,RegNo,ShopID,BillDate,OrderDate,DeliveryDate,  PaymentStatus,InvoiceNo, OrderNo, GSTNo, Quantity, SubTotal, DiscountAmount, GSTAmount,AddlDiscount, TotalAmount, DueAmount, Status,CreatedBy,CreatedOn, LastUpdate, Doctor, TrayNo, Employee, BillType, RoundOff, AddlDiscountPercentage, ProductStatus, BillingFlow,IsConvertInvoice, IsEcom) values (${billMaseterData.CustomerID}, ${CompanyID},'${billMaseterData.Sno}','${billMaseterData.RegNo}', ${billMaseterData.ShopID}, '${billMaseterData.BillDate}', '${billMaseterData.OrderDate}','${billMaseterData.DeliveryDate}', '${paymentMode}','${billingFlow === 1 ? billMaseterData.InvoiceNo : billMaseterData.OrderNo}','${billMaseterData.OrderNo}', '${billMaseterData.GSTNo}', ${billMaseterData.Quantity}, ${billMaseterData.TotalAmount}, ${billMaseterData.DiscountAmount}, ${billMaseterData.GSTAmount}, ${billMaseterData.AddlDiscount}, ${billMaseterData.TotalAmount}, ${billMaseterData.TotalAmount}, 1, ${LoggedOnUser}, '${req.headers.currenttime}','${req.headers.currenttime}', ${billMaseterData.Doctor ? billMaseterData.Doctor : 0}, '${billMaseterData.TrayNo}', ${billMaseterData.Employee ? billMaseterData.Employee : 0}, ${billType}, ${billMaseterData.RoundOff ? Number(billMaseterData.RoundOff) : 0}, ${billMaseterData.AddlDiscountPercentage ? Number(billMaseterData.AddlDiscountPercentage) : 0}, '${productStatus}', ${billingFlow}, ${billingFlow === 1 ? 1 : 0}, 1)`
            );

            console.log(connected("BillMaster Add SuccessFUlly !!!"));
            console.log("BillMaster ----> ", bMaster);

            let bMasterID = bMaster.insertId;

            // save Bill Details

            if (billDetailData.length) {
                for (let item of billDetailData) {
                    item.ProductDeliveryDate = '0000-00-00 00:00:00'
                    let preorder = 0;
                    let manual = 0;
                    let wholesale = 0
                    let order = 0
                    let result = {}
                    if (item.PreOrder === true) {
                        preorder = 1;
                    }
                    if (item.Manual === true) {
                        manual = 1;
                    }
                    if (item.WholeSale === true || item.WholeSale === "true") {
                        wholesale = 1;
                    }

                    if (manual === 0 && preorder === 0) {
                        let [newPurchasePrice] = await connection.query(`select UnitPrice, DiscountPercentage, GSTPercentage from purchasedetailnew where CompanyID = ${CompanyID} and BaseBarCode = '${item.Barcode}' and ProductTypeID = ${item.ProductTypeID} and ProductName = '${item.ProductName}' and ProductTypeName = '${item.ProductTypeName}'`);

                        console.log("newPurchasePrice Query :- ", `select UnitPrice, DiscountPercentage, GSTPercentage from purchasedetailnew where CompanyID = ${CompanyID} and BaseBarCode = '${item.Barcode}' and ProductTypeID = ${item.ProductTypeID} and ProductName = '${item.ProductName}' and ProductTypeName = '${item.ProductTypeName}'`);


                        let newPurchaseRate = 0
                        if (newPurchasePrice && newPurchasePrice.length > 0) {
                            newPurchaseRate = newPurchasePrice[0].UnitPrice - newPurchasePrice[0].UnitPrice * newPurchasePrice[0].DiscountPercentage / 100 + (newPurchasePrice[0].UnitPrice - newPurchasePrice[0].UnitPrice * newPurchasePrice[0].DiscountPercentage / 100) * newPurchasePrice[0].GSTPercentage / 100;
                        }


                        [result] = await connection.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate, ProductDeliveryDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode ? item.HSNCode : ''}',${item.SalePrice},${newPurchaseRate},${item.Quantity},${item.TotalAmonut}, ${item.DiscountPercentage ? item.DiscountPercentage : 0},${item.DiscountAmount ? item.DiscountAmount : 0},${item.GSTPercentage ? item.GSTPercentage : 0},${item.GSTAmount ? item.GSTAmount : 0},'${item.GSTType ? item.GSTType : 'None'}',${item.TotalAmonut},${wholesale},${manual}, ${preorder}, '${item.Barcode}' ,'${item.Barcode}',1,'${item.power ? item.power : []}','${item.Option ? item.Option : ''}','${item.Family ? item.Family : 'Self'}', ${LoggedOnUser}, '${req.headers.currenttime}', ${item.SupplierID ? item.SupplierID : 0}, '${item.Remark ? item.Remark : ''}', '${item.Warranty ? item.Warranty : ''}', '${item.ProductExpDate ? item.ProductExpDate : '0000-00-00'}', '${item.ProductDeliveryDate ? item.ProductDeliveryDate : '0000-00-00'}')`
                        );

                        if (item?.Location) {
                            const updateLocation = await updateLocatedProductCount(CompanyID, shopid, item.ProductTypeID, item.ProductTypeName, item.Barcode, item?.Location);
                            console.log("save Bill Location =====>", updateLocation);

                        }


                    } else if (manual === 1 && preorder === 0) {
                        item.BaseBarCode = await generateBarcode(CompanyID, 'MB')
                        item.Barcode = Number(item.BaseBarCode);
                        [result] = await connection.query(
                            `insert into billdetail (BillID,CompanyID,ProductTypeID,ProductTypeName,ProductName,HSNCode,UnitPrice,PurchasePrice,Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage,GSTAmount,GSTType,TotalAmount,WholeSale, Manual, PreOrder,BaseBarCode,Barcode,Status, MeasurementID, Optionsss, Family, CreatedBy,CreatedOn, SupplierID, Remark, Warranty, ProductExpDate, ProductDeliveryDate) values (${bMasterID}, ${CompanyID}, ${item.ProductTypeID},'${item.ProductTypeName}','${item.ProductName}', '${item.HSNCode ? item.HSNCode : ''}',${item.SalePrice},${item.PurchasePrice ? item.PurchasePrice : 0},${item.Quantity},${item.TotalAmonut}, ${item.DiscountPercentage ? item.DiscountPercentage : 0},${item.DiscountAmount ? item.DiscountAmount : 0},${item.GSTPercentage ? item.GSTPercentage : 0},${item.GSTAmount ? item.GSTAmount : 0},'${item.GSTType ? item.GSTType : 'None'}',${item.TotalAmonut},${wholesale},${manual}, ${preorder}, '${item.BaseBarCode}' ,'${item.Barcode}',1,'${item.power ? item.power : []}','${item.Option ? item.Option : ''}','${item.Family ? item.Family : 'Self'}', ${LoggedOnUser}, '${req.headers.currenttime}', ${item.SupplierID ? item.SupplierID : 0}, '${item.Remark ? item.Remark : ''}', '${item.Warranty ? item.Warranty : ''}', '${item.ProductExpDate ? item.ProductExpDate : '0000-00-00'}', '${item.ProductDeliveryDate ? item.ProductDeliveryDate : '0000-00-00'}')`
                        );
                    }


                    console.log("Bill Detail ---->", result);


                    const [selectRow] = await connection.query(`select * from billdetail where CompanyID = ${CompanyID} and BillID = ${bMasterID} and ID = ${result.insertId}`)

                    const ele = selectRow[0]

                    // save and update barcode master accordingly condition like manual, preorder and stock
                    if (ele.Manual === 1) {
                        let count = ele.Quantity;
                        let j = 0;
                        for (j = 0; j < count; j++) {
                            const [result] = await connection.query(`INSERT INTO barcodemasternew (CompanyID, ShopID, BillDetailID, BarCode, CurrentStatus,MeasurementID, Optionsss, Family, Status, CreatedBy, CreatedOn, AvailableDate, GSTType, GSTPercentage, PurchaseDetailID,RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount,PreOrder, TransferStatus, TransferToShop) VALUES (${CompanyID}, ${shopid},${ele.ID},'${ele.Barcode}', 'Not Available','${ele.MeasurementID}','${ele.Optionsss}','${ele.Family}', 1,${LoggedOnUser}, '${req.headers.currenttime}', '${req.headers.currenttime}', '${ele.GSTType}',${ele.GSTPercentage}, 0, ${ele.WholeSale !== 1 ? ele.UnitPrice : 0}, 0, 0, ${ele.WholeSale}, ${ele.WholeSale === 1 ? ele.UnitPrice : 0},0,0,'',0)`);
                        }
                    } else if (ele.PreOrder === 0 && ele.Manual === 0) {

                        let [selectRows1] = await connection.query(`SELECT barcodemasternew.ID FROM barcodemasternew left join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE barcodemasternew.CompanyID = ${CompanyID} AND barcodemasternew.ShopID = ${shopid} AND barcodemasternew.CurrentStatus = "Available" AND barcodemasternew.Status = 1 AND barcodemasternew.Barcode = '${ele.Barcode}' and purchasedetailnew.ProductName = '${ele.ProductName}' LIMIT ${ele.Quantity}`);

                        if (selectRows1.length) {
                            for (let ele1 of selectRows1) {
                                let [resultn] = await connection.query(`Update barcodemasternew set CurrentStatus = "Sold" , MeasurementID = '${ele.MeasurementID}', Family = '${ele.Family}',Optionsss = '${ele.Optionsss}', BillDetailID = ${ele.ID}, UpdatedBy=${LoggedOnUser}, UpdatedOn='${req.headers.currenttime}' Where CompanyID = ${CompanyID} and ID = ${ele1.ID} and  ShopID = ${shopid}`);
                            }
                        } else {
                            console.log("Stock no available, something went wrong");
                        }

                        // update c report setting

                        const var_update_c_report_setting = await update_c_report_setting(CompanyID, shopid, req.headers.currenttime)

                        const var_update_c_report = await update_c_report(CompanyID, shopid, 0, 0, 0, ele.Quantity, 0, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)

                        const totalAmount = await getTotalAmountByBarcode(CompanyID, ele.Barcode)

                        const var_amt_update_c_report = await amt_update_c_report(CompanyID, shopid, 0, 0, 0, ele.Quantity * Number(totalAmount), 0, 0, 0, 0, 0, 0, 0, 0, 0, req.headers.currenttime)
                    }
                }

                // save employee commission

                if (billMaseterData.Employee !== 0 && billMaseterData.Employee !== undefined && billMaseterData.Employee !== null) {
                    const saveEmpCommission = await generateCommission(CompanyID, 'Employee', billMaseterData.Employee, bMasterID, billMaseterData, LoggedOnUser)
                }

                // save doctor commission

                if (billMaseterData.Doctor !== 0 && billMaseterData.Doctor !== undefined && billMaseterData.Doctor !== null) {
                    const saveDocCommission = await generateCommission(CompanyID, 'Doctor', billMaseterData.Doctor, bMasterID, billMaseterData, LoggedOnUser)
                }
            }

            // save service for shipment rate
            if (Number(billMaseterData.ShipmentRate) > 0) {
                let ShipMentRate = Number(billMaseterData.ShipmentRate);
                let ServiceName = "COURIER SERVICE"
                let ServiceId = 0;
                const [doesExistService] = await connection.query(`select ID from servicemaster where CompanyID = ${CompanyID} and Status = 1 and Name = '${ServiceName}'`);

                if (!doesExistService.length) {
                    const [saveDataService] = await connection.query(`insert into servicemaster (CompanyID, Name, Description,Cost, Price, SubTotal,  GSTPercentage, GSTAmount, GSTType, TotalAmount, Status, CreatedBy , CreatedOn ) values (${CompanyID},'${ServiceName}','${ServiceName}', 0 ,0,0,0,0,'None',0, 1, ${LoggedOnUser}, now())`);

                    ServiceId = saveDataService.insertId;

                } else {
                    ServiceId = doesExistService[0].ID;
                }


                let [saveBillService] = await connection.query(
                    `insert into billservice ( BillID, ServiceType ,CompanyID,Description, Price,SubTotal, GSTPercentage, GSTAmount, GSTType,DiscountPercentage, DiscountAmount, TotalAmount, Status,CreatedBy,CreatedOn, MeasurementID ) values (${bMasterID}, '${ServiceId}', ${CompanyID},  '${ServiceName}', ${ShipMentRate},  ${ShipMentRate}, 0, 0, 'None', 0, 0, ${ShipMentRate},1,${LoggedOnUser}, now() ,'')`
                );

            }


            // payment inititated

            const [savePaymentMaster] = await connection.query(`insert into paymentmaster(CustomerID, CompanyID, ShopID, PaymentType, CreditType, PaymentDate, PaymentMode, CardNo, PaymentReferenceNo, PayableAmount, PaidAmount, Comments, Status, CreatedBy, CreatedOn)values(${billMaseterData.CustomerID}, ${CompanyID}, ${shopid}, 'Customer','Credit','${req.headers.currenttime}', 'Payment Initiated', '', '', ${billMaseterData.TotalAmount}, 0, '',1,${LoggedOnUser}, '${req.headers.currenttime}')`)

            const [savePaymentDetail] = await connection.query(`insert into paymentdetail(PaymentMasterID,BillID,BillMasterID,CustomerID,CompanyID,Amount,DueAmount,PaymentType,Credit,Status,CreatedBy,CreatedOn)values(${savePaymentMaster.insertId},'${billingFlow === 1 ? billMaseterData.InvoiceNo : billMaseterData.OrderNo}',${bMasterID},${billMaseterData.CustomerID},${CompanyID},0,${billMaseterData.TotalAmount},'Customer','Credit',1,${LoggedOnUser}, '${req.headers.currenttime}')`)

            console.log(connected("Payment Initiate SuccessFUlly !!!"));

            const [update] = await connection.query(`update ecom_billmaster set OrderStatus = "Confirmed" where ID = ${rows[0].ID}`);


            return res.status(200).json({
                success: true,
                message: "Order Process Complete"
            });

        } catch (error) {
            console.error("Error while order process:", error);
            return res.status(500).json({
                success: false,
                message: "Error while order process"
            });
        } finally {
            if (connection) connection.release();
        }
    },
    searchByString: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { Req, PreOrder, ShopMode } = req.body
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            let SearchString = Req.searchString;
            let searchString = "%" + SearchString + "%";

            let shopMode = "";
            // if (ShopMode === "false" || ShopMode === false) {
            //     shopMode = " barcodemasternew.ShopID = " + shopid + " AND";
            // } else {
            //     shopMode = " ";
            // }

            let qry = `SELECT COUNT(barcodemasternew.ID) AS BarCodeCount, shop.ID as ShopID,  shop.Name as ShopName,shop.AreaName,CONCAT(purchasedetailnew.ProductTypeName, "/", purchasedetailnew.ProductName) AS FullProductName,purchasedetailnew.BaseBarCode,purchasemasternew.SupplierID,purchasedetailnew.ProductTypeID, purchasedetailnew.ProductTypeName, purchasedetailnew.ProductName, 'false' as SameShopProduct, 'false' as OtherShopProduct FROM purchasedetailnew LEFT JOIN barcodemasternew ON barcodemasternew.PurchaseDetailID = purchasedetailnew.ID Left Join shop on shop.ID = barcodemasternew.ShopID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID  WHERE  barcodemasternew.CurrentStatus = "Available" AND purchasedetailnew.Status = 1  and shop.Status = 1 And barcodemasternew.CompanyID = ${CompanyID} AND  ${shopMode} CONCAT(purchasedetailnew.ProductTypeName, "/", purchasedetailnew.ProductName) LIKE '${searchString}' GROUP BY barcodemasternew.Barcode, barcodemasternew.ShopID`;

            let [data] = await connection.query(qry);
            response.message = "data fetch sucessfully"

            if (data.length) {
                for (let item of data) {
                    if (shopid === item.ShopID || shopid == item.ShopID) {
                        item.SameShopProduct = "true"
                    } else {
                        item.OtherShopProduct = "true"
                    }
                }
            }

            response.data = data
            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    searchByBarcodeNo: async (req, res, next) => {
        let connection;
        try {
            const response = { data: null, success: true, message: "" }
            const LoggedOnUser = req.user.ID ? req.user.ID : 0
            const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
            const shopid = await shopID(req.headers) || 0;
            const { Req, PreOrder, ShopMode } = req.body
            // const db = await dbConfig.dbByCompanyID(CompanyID);
            const db = req.db;
            if (db.success === false) {
                return res.status(200).json(db);
            }
            connection = await db.getConnection();
            // console.log(ShopMode, 'ShopMode');
            let barCode = Req.SearchBarCode;
            let qry = "";
            if (PreOrder === "false") {
                let shopMode = "";
                let searchParams = ``
                if (Req?.searchString !== null && Req?.searchString !== "" && Req?.searchString !== undefined) {
                    searchParams = ` and purchasedetailnew.ProductName = '${Req.searchString}' `
                }

                if (ShopMode === false) {
                    shopMode = " And barcodemasternew.ShopID = " + shopid;
                } else {
                    shopMode = " Group By barcodemasternew.ShopID ";
                }
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName,purchasedetailnew.ProductTypeID,purchasedetailnew.ProductExpDate, barcodemasternew.*,shop.Name as ShopName, shop.AreaName as AreaName,purchasedetailnew.UnitPrice, purchasedetailnew.BaseBarCode, barcodemasternew.RetailPrice as RetailPrice, barcodemasternew.WholeSalePrice as WholeSalePrice   FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID left join shop on shop.ID = barcodemasternew.ShopID Left join purchasemasternew on purchasemasternew.ID = purchasedetailnew.PurchaseID  WHERE CurrentStatus = "Available" AND Barcode = '${barCode}' ${searchParams}  and purchasedetailnew.Status = 1 and purchasedetailnew.PurchaseID != 0 and  purchasedetailnew.CompanyID = ${CompanyID} ${shopMode}`;
            } else {
                qry = `SELECT COUNT(PurchaseDetailID) AS BarCodeCount, purchasedetailnew.GSTType, purchasedetailnew.GSTPercentage,purchasedetailnew.GSTAmount, purchasedetailnew.ProductName,purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice, purchasedetailnew.ProductTypeID, barcodemasternew.*,shop.Name as ShopName, shop.AreaName as AreaName,purchasedetailnew.BaseBarCode, barcodemasternew.RetailPrice as RetailPrice, barcodemasternew.WholeSalePrice as WholeSalePrice FROM barcodemasternew Left Join purchasedetailnew on purchasedetailnew.ID = barcodemasternew.PurchaseDetailID left join shop on shop.ID = barcodemasternew.ShopID WHERE barcodemasternew.Barcode = '${barCode}' and purchasedetailnew.Status = 1 AND barcodemasternew.CurrentStatus = 'Pre Order'  and purchasedetailnew.CompanyID = ${CompanyID}`;

            }


            let [data] = await connection.query(qry);
            response.message = "data fetch sucessfully"
            response.data = data

            return res.send(response);


        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }
    },
    getSubdomain: async (req, res, next) => {
        let connection;
        try {
            const { url } = req.body;
            if (!url) {
                return res.status(200).json({
                    success: false,
                    message: 'URL is required'
                });
            }

            const subdomain = await getSubdomain(url);

            let companyid = null

            if (subdomain !== null) {
                connection = await mysql2.pool.getConnection();
                const [fetchCompany] = connection.query(`select ID, SubDomainName from company where SubDomainName = '${subdomain}'`);

                if (fetchCompany.length) {
                    companyid = fetchCompany[0]?.ID || null
                }
            }

            return res.json({
                success: true,
                subdomain,
                CompanyID: companyid
            });

        } catch (err) {
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
            }
        }

    }
}