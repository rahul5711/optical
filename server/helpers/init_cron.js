const cron = require('node-cron');
const pass_init = require('./generate_password')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')
var moment = require("moment");

const cronConnect = async() => {
    cron.schedule('0 0 * * *', async () => {
        // This function will run at 12:00 AM (midnight) every day
        // Add your code logic here
<<<<<<< HEAD
        // every second 0 * * * * *
        // Job executed at 2 AM 0 2 * * *
        // Job executed at 12 AM 0 0 * * *
=======
        // 0 2 * * * every day 2 AM
        // * * * * * every second
>>>>>>> a3eae9babea3b8f8cef8c2f0383c313ccdb26d11
        try {
            console.log('This function will run at 12:00 AM (midnight) every day');
            let date = moment(new Date()).format("YYYY-MM-DD")
            let back_date = moment(date).subtract(1, 'days').format("YYYY-MM-DD");

            const [company] = await mysql2.pool.query(`select ID, Name from company where Status = 1`)
            let result = []
            if (company) {
                result = JSON.parse(JSON.stringify(company))
            }

            if (result) {
               for(let data of result) {
                    const [fetch] = await mysql2.pool.query(`select * from creport where Date = '${date}' and CompanyID = ${data.ID}`)
                    const [fetch_back_date] = await mysql2.pool.query(`select * from creport where Date = '${back_date}' and CompanyID = ${data.ID} and ShopID = 0`)

                    if (!fetch.length && fetch_back_date.length) {
                       const [save] = await mysql2.pool.query(`insert into creport(Date, CompanyID, ShopID, OpeningStock, AddPurchase, AddPreOrderPurchase, DeletePurchase, AddSale, DeleteSale, AddPreOrderSale, DeletePreOrderSale, AddManualSale, DeleteManualSale, OtherDeleteStock, InitiateTransfer, CancelTransfer, AcceptTransfer, ClosingStock, AmtOpeningStock, AmtAddPurchase, AmtAddPreOrderPurchase, AmtDeletePurchase, AmtAddSale, AmtDeleteSale, AmtAddPreOrderSale, AmtDeletePreOrderSale, AmtAddManualSale, AmtDeleteManualSale, AmtOtherDeleteStock, AmtInitiateTransfer, AmtCancelTransfer, AmtAcceptTransfer, AmtClosingStock)values('${date}', ${data.ID},0,${fetch_back_date[0].ClosingStock},0,0,0,0,0,0,0,0,0,0,0,0,0,${fetch_back_date[0].ClosingStock},'${fetch_back_date[0].AmtClosingStock}',0,0,0,0,0,0,0,0,0,0,0,0,0,'${fetch_back_date[0].AmtClosingStock}')`);

                       console.log(connected(`CompanyID : - ${data.ID}, Name:- ${data.Name} Created SuccessFully !!!!`));
                    }

                    const [fetchShop] = await mysql2.pool.query(`select ID, Name from shop where Status = 1 and CompanyID = ${data.ID}`)

                    if (fetchShop.length) {

                        for(let item of fetchShop) {

                            const [fetchShopWise] = await mysql2.pool.query(`select * from creport where Date = '${date}' and CompanyID = ${data.ID} and ShopID = ${item.ID}`)

                            const [fetchShopWise_back_date] = await mysql2.pool.query(`select * from creport where Date = '${back_date}' and CompanyID = ${data.ID} and ShopID = ${item.ID}`)


                            if (!fetchShopWise.length && fetchShopWise_back_date.length) {

                                const [save] = await mysql2.pool.query(`insert into creport(Date, CompanyID, ShopID, OpeningStock, AddPurchase, AddPreOrderPurchase, DeletePurchase, AddSale, DeleteSale, AddPreOrderSale, DeletePreOrderSale, AddManualSale, DeleteManualSale, OtherDeleteStock, InitiateTransfer, CancelTransfer, AcceptTransfer, ClosingStock, AmtOpeningStock, AmtAddPurchase, AmtAddPreOrderPurchase, AmtDeletePurchase, AmtAddSale, AmtDeleteSale, AmtAddPreOrderSale, AmtDeletePreOrderSale, AmtAddManualSale, AmtDeleteManualSale, AmtOtherDeleteStock, AmtInitiateTransfer, AmtCancelTransfer, AmtAcceptTransfer, AmtClosingStock)values('${date}', ${data.ID},${item.ID},${fetchShopWise_back_date[0].ClosingStock},0,0,0,0,0,0,0,0,0,0,0,0,0,${fetchShopWise_back_date[0].ClosingStock},'${fetchShopWise_back_date[0].AmtClosingStock}',0,0,0,0,0,0,0,0,0,0,0,0,0,'${fetchShopWise_back_date[0].AmtClosingStock}')`);

                                console.log(connected(`CompanyID : - ${data.ID}, CompanyName:- ${data.Name}, ShopID :- ${item.ID}, ShopName:- ${item.Name} Created SuccessFully !!!!`));
                            }

                        }

                    }


               }
            }

            console.log(connected(`Data all updated !!!`));

        } catch (error) {
            console.log(error)
        }
    })
}


module.exports = {
    cronConnect,
}