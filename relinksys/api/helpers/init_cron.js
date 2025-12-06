const cron = require('node-cron');
const pass_init = require('./generate_password')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');

var moment = require("moment");

const cronConnect = async () => {
    cron.schedule('0 0 * * *', async () => {
        // This function will run at 12:00 AM (midnight) every day
        // Add your code logic here

        // every second 0 * * * * *
        // Job executed at 2 AM 0 2 * * *
        // Job executed at 12 AM 0 0 * * *

        // 0 2 * * * every day 2 AM
        // * * * * * every second a3eae9babea3b8f8cef8c2f0383c313ccdb26d11
        let connection;
        let DB;
        try {
            console.log('This function will run at 12:00 AM (midnight) every day');
            let date = moment(new Date()).format("YYYY-MM-DD")
            let back_date = moment(date).subtract(1, 'days').format("YYYY-MM-DD");
            DB = await mysql2.pool.getConnection();

            const [company] = await DB.query(`select ID, Name from company where Status = 1`)
            let result = []
            if (company) {
                result = JSON.parse(JSON.stringify(company))
            }

            if (result) {
                for (let data of result) {
                    // const db = await dbConfig.dbByCompanyID(data.ID);
                    const db = await dbConnection(data.ID);
                    if (db.success === false) {
                        return res.status(200).json(db);
                    }
                    connection = await db.getConnection();
                    const [fetch] = await connection.query(`select * from creport where Date = '${date}' and CompanyID = ${data.ID}`)
                    const [fetch_back_date] = await connection.query(`select * from creport where Date = '${back_date}' and CompanyID = ${data.ID} and ShopID = 0`)

                    if (!fetch.length && fetch_back_date.length) {
                        const [save] = await connection.query(`insert into creport(Date, CompanyID, ShopID, OpeningStock, AddPurchase, AddPreOrderPurchase, DeletePurchase, AddSale, DeleteSale, AddPreOrderSale, DeletePreOrderSale, AddManualSale, DeleteManualSale, OtherDeleteStock, InitiateTransfer, CancelTransfer, AcceptTransfer, ClosingStock, AmtOpeningStock, AmtAddPurchase, AmtAddPreOrderPurchase, AmtDeletePurchase, AmtAddSale, AmtDeleteSale, AmtAddPreOrderSale, AmtDeletePreOrderSale, AmtAddManualSale, AmtDeleteManualSale, AmtOtherDeleteStock, AmtInitiateTransfer, AmtCancelTransfer, AmtAcceptTransfer, AmtClosingStock)values('${date}', ${data.ID},0,${fetch_back_date[0].ClosingStock},0,0,0,0,0,0,0,0,0,0,0,0,0,${fetch_back_date[0].ClosingStock},'${fetch_back_date[0].AmtClosingStock}',0,0,0,0,0,0,0,0,0,0,0,0,0,'${fetch_back_date[0].AmtClosingStock}')`);

                        console.log(connected(`CompanyID : - ${data.ID}, Name:- ${data.Name} Created SuccessFully !!!!`));
                    }

                    const [fetchShop] = await connection.query(`select ID, Name from shop where Status = 1 and CompanyID = ${data.ID}`)

                    if (fetchShop.length) {

                        for (let item of fetchShop) {

                            const [fetchShopWise] = await connection.query(`select * from creport where Date = '${date}' and CompanyID = ${data.ID} and ShopID = ${item.ID}`)

                            const [fetchShopWise_back_date] = await connection.query(`select * from creport where Date = '${back_date}' and CompanyID = ${data.ID} and ShopID = ${item.ID}`)


                            if (!fetchShopWise.length && fetchShopWise_back_date.length) {

                                const [save] = await connection.query(`insert into creport(Date, CompanyID, ShopID, OpeningStock, AddPurchase, AddPreOrderPurchase, DeletePurchase, AddSale, DeleteSale, AddPreOrderSale, DeletePreOrderSale, AddManualSale, DeleteManualSale, OtherDeleteStock, InitiateTransfer, CancelTransfer, AcceptTransfer, ClosingStock, AmtOpeningStock, AmtAddPurchase, AmtAddPreOrderPurchase, AmtDeletePurchase, AmtAddSale, AmtDeleteSale, AmtAddPreOrderSale, AmtDeletePreOrderSale, AmtAddManualSale, AmtDeleteManualSale, AmtOtherDeleteStock, AmtInitiateTransfer, AmtCancelTransfer, AmtAcceptTransfer, AmtClosingStock)values('${date}', ${data.ID},${item.ID},${fetchShopWise_back_date[0].ClosingStock},0,0,0,0,0,0,0,0,0,0,0,0,0,${fetchShopWise_back_date[0].ClosingStock},'${fetchShopWise_back_date[0].AmtClosingStock}',0,0,0,0,0,0,0,0,0,0,0,0,0,'${fetchShopWise_back_date[0].AmtClosingStock}')`);

                                console.log(connected(`CompanyID : - ${data.ID}, CompanyName:- ${data.Name}, ShopID :- ${item.ID}, ShopName:- ${item.Name} Created SuccessFully !!!!`));
                            }

                        }

                    }


                }
            }

            console.log(connected(`Data all updated !!!`));

        } catch (error) {
            console.log(error)
        } finally {
            if (DB) {
                try {
                    DB.release();
                    console.log("✅ MySQL pool connection released");
                } catch (releaseErr) {
                    console.error("⚠️ Error releasing MySQL pool connection:", releaseErr);
                }
            }
            if (connection) {
                try {
                    connection.release();
                    console.log("✅ Company DB connection released");
                } catch (releaseErr) {
                    console.error("⚠️ Error releasing company DB connection:", releaseErr);
                }
            }
        }
    })
}

const manuallyCronConnect = async () => {
    let connection;
    let DB;
    try {
        let date = moment(new Date()).format("YYYY-MM-DD")
        let back_date = moment(date).subtract(1, 'days').format("YYYY-MM-DD");
        DB = await mysql2.pool.getConnection();

        const [company] = await DB.query(`select ID, Name from company where Status = 1`)
        let result = []
        if (company) {
            result = JSON.parse(JSON.stringify(company))
        }

        if (result) {
            for (let data of result) {
                // const db = await dbConfig.dbByCompanyID(data.ID);
                const db = await dbConnection(data.ID);
                if (db.success === false) {
                    return res.status(200).json(db);
                }
                connection = await db.getConnection();
                const [fetch] = await connection.query(`select * from creport where Date = '${date}' and CompanyID = ${data.ID}`)
                const [fetch_back_date] = await connection.query(`select * from creport where Date = '${back_date}' and CompanyID = ${data.ID} and ShopID = 0`)

                if (!fetch.length && fetch_back_date.length) {
                    const [save] = await connection.query(`insert into creport(Date, CompanyID, ShopID, OpeningStock, AddPurchase, AddPreOrderPurchase, DeletePurchase, AddSale, DeleteSale, AddPreOrderSale, DeletePreOrderSale, AddManualSale, DeleteManualSale, OtherDeleteStock, InitiateTransfer, CancelTransfer, AcceptTransfer, ClosingStock, AmtOpeningStock, AmtAddPurchase, AmtAddPreOrderPurchase, AmtDeletePurchase, AmtAddSale, AmtDeleteSale, AmtAddPreOrderSale, AmtDeletePreOrderSale, AmtAddManualSale, AmtDeleteManualSale, AmtOtherDeleteStock, AmtInitiateTransfer, AmtCancelTransfer, AmtAcceptTransfer, AmtClosingStock)values('${date}', ${data.ID},0,${fetch_back_date[0].ClosingStock},0,0,0,0,0,0,0,0,0,0,0,0,0,${fetch_back_date[0].ClosingStock},'${fetch_back_date[0].AmtClosingStock}',0,0,0,0,0,0,0,0,0,0,0,0,0,'${fetch_back_date[0].AmtClosingStock}')`);

                    console.log(connected(`CompanyID : - ${data.ID}, Name:- ${data.Name} Created SuccessFully !!!!`));
                }

                const [fetchShop] = await connection.query(`select ID, Name from shop where Status = 1 and CompanyID = ${data.ID}`)

                if (fetchShop.length) {

                    for (let item of fetchShop) {

                        const [fetchShopWise] = await connection.query(`select * from creport where Date = '${date}' and CompanyID = ${data.ID} and ShopID = ${item.ID}`)

                        const [fetchShopWise_back_date] = await connection.query(`select * from creport where Date = '${back_date}' and CompanyID = ${data.ID} and ShopID = ${item.ID}`)


                        if (!fetchShopWise.length && fetchShopWise_back_date.length) {

                            const [save] = await connection.query(`insert into creport(Date, CompanyID, ShopID, OpeningStock, AddPurchase, AddPreOrderPurchase, DeletePurchase, AddSale, DeleteSale, AddPreOrderSale, DeletePreOrderSale, AddManualSale, DeleteManualSale, OtherDeleteStock, InitiateTransfer, CancelTransfer, AcceptTransfer, ClosingStock, AmtOpeningStock, AmtAddPurchase, AmtAddPreOrderPurchase, AmtDeletePurchase, AmtAddSale, AmtDeleteSale, AmtAddPreOrderSale, AmtDeletePreOrderSale, AmtAddManualSale, AmtDeleteManualSale, AmtOtherDeleteStock, AmtInitiateTransfer, AmtCancelTransfer, AmtAcceptTransfer, AmtClosingStock)values('${date}', ${data.ID},${item.ID},${fetchShopWise_back_date[0].ClosingStock},0,0,0,0,0,0,0,0,0,0,0,0,0,${fetchShopWise_back_date[0].ClosingStock},'${fetchShopWise_back_date[0].AmtClosingStock}',0,0,0,0,0,0,0,0,0,0,0,0,0,'${fetchShopWise_back_date[0].AmtClosingStock}')`);

                            console.log(connected(`CompanyID : - ${data.ID}, CompanyName:- ${data.Name}, ShopID :- ${item.ID}, ShopName:- ${item.Name} Created SuccessFully !!!!`));
                        }

                    }

                }


            }
        }

        console.log(connected(`Data all updated !!!`));

        return { success: true, message: "Cron is update." }

    } catch (error) {
        console.log(error)
    } finally {
        if (DB) {
            try {
                DB.release();
                console.log("✅ MySQL pool connection released");
            } catch (releaseErr) {
                console.error("⚠️ Error releasing MySQL pool connection:", releaseErr);
            }
        }
        if (connection) {
            try {
                connection.release();
                console.log("✅ Company DB connection released");
            } catch (releaseErr) {
                console.error("⚠️ Error releasing company DB connection:", releaseErr);
            }
        }
    }
}


module.exports = {
    cronConnect,
    manuallyCronConnect
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