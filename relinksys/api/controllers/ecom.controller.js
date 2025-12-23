const createError = require('http-errors')
const _ = require("lodash")
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');
const { shopID } = require('../helpers/helper_function');

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

            /** ===============================
             * Shop Validation
             =============================== */
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
                Images
            } = req.body;

            /** ===============================
             * BASIC VALIDATION
             =============================== */
            if (!ProductName || ProductName.trim() === "") {
                return res.send({
                    success: false,
                    message: "Product name is required"
                });
            }

            if (SalePrice === undefined || isNaN(SalePrice) || Number(SalePrice) < 0) {
                return res.send({
                    success: false,
                    message: "Invalid Sale Price"
                });
            }

            if (OfferPrice !== undefined && (isNaN(OfferPrice) || Number(OfferPrice) < 0)) {
                return res.send({
                    success: false,
                    message: "Invalid Offer Price"
                });
            }

            if (Quantity === undefined || isNaN(Quantity) || Number(Quantity) < 0) {
                return res.send({
                    success: false,
                    message: "Invalid Quantity"
                });
            }

            /** ===============================
             * INSERT
             =============================== */
            if (!ID || ID === 0) {
                const insertQuery = `
                INSERT INTO products (
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
                    CreatedBy,
                    CreatedOn
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
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
                    PublishCode,
                    JSON.stringify(Images || []),
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
                UPDATE products SET
                    ProductTypeID = ?,
                    ProductTypeName = ?,
                    ProductName = ?,
                    SalePrice = ?,
                    OfferPrice = ?,
                    Quantity = ?,
                    Status = ?,
                    IsPublished = ?,
                    IsOutOfStock = ?,
                    PublishCode = ?,
                    Images = ?,
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
                    PublishCode,
                    JSON.stringify(Images || []),
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
            next(err)
        } finally {
            if (connection) {
                connection.release(); // Always release the connection
                connection.destroy();
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
                CreatedBy,
                CreatedOn,
                UpdatedBy,
                UpdatedOn
            FROM products
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
    }
}