const createError = require('http-errors')
const _ = require("lodash")
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');
const { shopID } = require('../helpers/helper_function');
const axios = require('axios');
const Joi = require('joi');

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
    ShipmentRate: Joi.number().min(0).required()
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
                    CreatedOn
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
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
                    LoggedOnUser
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

            return res.status(200).json({
                success: true,
                message: "Login successful",
                data: user[0]   // full row returned
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

            const [cartData] = await connection.query(`select ecom_addtocart.ID,ecom_addtocart.Quantity, ecom_product.ProductTypeID,ecom_product.ProductTypeName,ecom_product.ProductName,ecom_product.SalePrice,ecom_product.OfferPrice,ecom_product.IsPublished,ecom_product.IsOutOfStock,ecom_product.PublishCode,ecom_product.Images,ecom_product.Description,ecom_product.Gender,ecom_product.CreatedBy,ecom_product.CreatedOn,ecom_product.UpdatedBy,ecom_product.UpdatedOn from ecom_addtocart left join ecom_product on ecom_product.PublishCode = ecom_addtocart.PublishCode where ecom_addtocart.CompanyID = ${user[0].CompanyID} and ecom_addtocart.Status = 1 and ecom_addtocart.UserID = ${user[0].UserID}`);

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

            const { CompanyID, UserID, Quantity, SubTotal, ShipmentRate, TotalAmount } = billMaseterData;

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

            const [billMasterResult] = await connection.query(`INSERT INTO ecom_billmaster (CompanyID, UserID, OrderNo, Quantity, Status, OrderStatus, SubTotal, ShipmentRate, TotalAmount, CreatedOn, UpdatedOn) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`, [CompanyID, UserID, OrderNo, Quantity, 1, "Pending", SubTotal, ShipmentRate, TotalAmount]);

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

            const [products] = await connection.query(`SELECT ecom_billdetail.ID, ecom_billdetail.addToCartID, ecom_billdetail.PublishCode, ecom_billdetail.SalePrice, ecom_billdetail.OfferPrice, ecom_billdetail.Quantity, ecom_billdetail.TotalAmonut, ecom_billdetail.Description, ecom_billdetail.Gender, ecom_billdetail.power, ecom_product.ProductTypeID,ecom_product.ProductTypeName,ecom_product.ProductName FROM ecom_billdetail left join ecom_product on ecom_product.PublishCode = ecom_billdetail.PublishCode WHERE ecom_billdetail.BillMasterID = ? AND ecom_billdetail.CompanyID = ? AND ecom_billdetail.Status = 1`, [BillMasterID, CompanyID]);

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
    }
}