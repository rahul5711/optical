const pass_init = require('./generate_password')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')
var moment = require("moment");
const { getInventory, getInventoryAmt } = require('../helpers/helper_function')
const init = async () => {
    try {

        const [doesExist] = await mysql2.pool.query(`select * from user where UserGroup = 'SuperAdmin' and Status = 1`)

        if (!doesExist.length) {

            const datum = {
                ID: 0,
                CompanyID: 0,
                Name: 'Relinksys software pvt ltd',
                UserGroup: 'SuperAdmin',
                DOB: '1987-10-13',
                Anniversary: '2018-04-19',
                MobileNo1: '9766666248',
                MobileNo2: '9130366248',
                PhoneNo: '9131860873',
                Email: 'relinksys@gmail.com',
                Address: 'Pune',
                Branch: 'Pune',
                PhotoURL: 'null',
                Document: [],
                LoginName: 'RVS@248',
                Password: await pass_init.hash_password('RVS@248'),
                Status: 1,
                CreatedBy: 0,
                UpdatedBy: 0,
                CreatedOn: new Date(),
                UpdatedOn: new Date(),
                CommissionType: 0,
                CommissionMode: 0,
                CommissionValue: 0,
                CommissionValueNB: 0
            }

            const [savedata] = await mysql2.pool.query(`insert into user(ID,CompanyID,Name,UserGroup,DOB,Anniversary,MobileNo1,MobileNo2,PhoneNo,Email,Address,Branch,PhotoURL,Document,LoginName,Password,Status,CreatedBy,UpdatedBy,CreatedOn,UpdatedOn,CommissionType,CommissionMode,CommissionValue,CommissionValueNB) values(${datum.ID},${datum.CompanyID},'${datum.Name}','${datum.UserGroup}','${datum.DOB}','${datum.Anniversary}','${datum.MobileNo1}','${datum.MobileNo2}','${datum.PhoneNo}','${datum.Email}','${datum.Address}','${datum.Branch}','${datum.PhotoURL}','${datum.Document}','${datum.LoginName}','${datum.Password}',${datum.Status},${datum.CreatedBy},${datum.UpdatedBy},now(),now(),${datum.CommissionType},${datum.CommissionMode},${datum.CommissionValue},${datum.CommissionValueNB})`)


            console.log(connected("Super Admin Created SuccessFully !!!!"));
        } else {

            const datum = {
                ID: 0,
                CompanyID: 0,
                Name: 'Relinksys software pvt ltd',
                UserGroup: 'SuperAdmin',
                DOB: '1987-10-13',
                Anniversary: '2018-04-19',
                MobileNo1: '9766666248',
                MobileNo2: '9130366248',
                PhoneNo: '9131860873',
                Email: 'relinksys@gmail.com',
                Address: 'Pune',
                Branch: 'Pune',
                PhotoURL: '',
                Document: [],
                LoginName: 'RVS@248',
                Password: await pass_init.hash_password('RVS@248'),
                Status: 1,
                CreatedBy: 0,
                UpdatedBy: 0,
                CreatedOn: new Date(),
                UpdatedOn: new Date(),
                CommissionType: 0,
                CommissionMode: 0,
                CommissionValue: 0,
                CommissionValueNB: 0
            }

            // const update_data = await mysql2.pool.query(``)


            console.log(connected("Super Admin Updated SuccessFully !!!!"));


        }


    } catch (error) {
        console.log(error)
    }
}
const product = async () => {
    try {

        const [product] = await mysql2.pool.query(`SELECT ${0} as CompanyID ,product.Name, product.HSNCode, product.GSTPercentage,product.GSTType, product.Status, 0 AS CreatedBy, NOW() AS CreatedOn FROM product WHERE STATUS = 1 AND CompanyID = 0`)
        let result = []
        if (product) {
            result = JSON.parse(JSON.stringify(product))
        }

        if (result) {

            for (const item of result) {
                const [saveProduct] = await mysql2.pool.query(`insert into product(CompanyID, Name, HSNCode,GSTPercentage,GSTType,Status,CreatedBy,CreatedOn) values(${item.CompanyID}, '${item.Name}', '${item.HSNCode}',${item.GSTPercentage}, '${item.GSTType}', 1, 0, now())`)
            }

            console.log(connected("Product Assign SuccessFully !!!!"));

        }

        const [productSpec] = await mysql2.pool.query(`select * from productspec where Status = 1 and CompanyID = 0`)
        let result2 = []
        if (productSpec) {
            result2 = JSON.parse(JSON.stringify(productSpec))
        }

        if (result2) {

            for (const item of result2) {
                if (item.Type === 'DropDown') {
                    item.SptTableName = item.ProductName + Math.floor(Math.random() * 999999) + 1;
                } else {
                    item.SptTableName = ''
                }
                if (item.Type === 'DropDown') {
                    const [saveSpec] = await mysql2.pool.query(`insert into productspec(ProductName, CompanyID, Name,Seq,Type,Ref,SptTableName,Status,CreatedBy,CreatedOn)values('${item.ProductName}', 122, '${item.Name}', '${item.Seq}', '${item.Type}', '${item.Ref}', '${item.SptTableName}',1,0,now())`)
                } else if (item.Type !== 'DropDown') {
                    const [saveSpec] = await mysql2.pool.query(`insert into productspec(ProductName, CompanyID, Name,Seq,Type,Ref,SptTableName,Status,CreatedBy,CreatedOn)values('${item.ProductName}', 122, '${item.Name}', '${item.Seq}', '${item.Type}', '${item.Ref}', '${item.SptTableName}',1,0,now())`)
                }
            }

            console.log(connected("ProductSpec Assign SuccessFully !!!!"));

        }

    } catch (error) {
        console.log(error)
    }
}
const product_support = async () => {
    try {
        // spec spt table data to another company

        const [support_data] = await mysql2.pool.query(`select * from productspec where Status = 1 and CompanyID = 0 and Type = 'DropDown'`)
        let support_data_result = []
        if (support_data) {
            support_data_result = JSON.parse(JSON.stringify(support_data))
        }

        let complete_data = []

        if (support_data_result) {
            complete_data = []
            for (const item of support_data_result) {

                let [result] = await mysql2.pool.query(`select * from specspttable where Status = 1 and TableName = '${item.SptTableName}'`)
                if (result) {
                    result = JSON.parse(JSON.stringify(result))
                    for (const item2 of result) {
                        item2.ProductName = item.ProductName;
                        item2.Name = item.Name;
                        complete_data.push(item2)
                    }

                }
            }
        }

        if (complete_data) {
            for (const item of complete_data) {
                let [TableName] = await mysql2.pool.query(`select * from productspec where Status = 1 and ProductName = '${item.ProductName}' and Type = 'DropDown' and Name = '${item.Name}' and CompanyID = 134`)
                if (TableName) {
                    TableName = JSON.parse(JSON.stringify(TableName))
                }
                item.SptTableName = TableName[0].SptTableName
                // item.RefID = TableName[0].Ref

                console.log(item, 'tablename');
                // let saveData = await mysql2.pool.query(`insert into SpecSptTable (TableName,  RefID, TableValue, Status,UpdatedOn,UpdatedBy) values ('${item.TableName}','${item.Ref}','${item.SelectedValue}',1,now(),${LoggedOnUser.ID})`)
            }
        }


    } catch (error) {
        console.log(error)
    }
}
const c_report_init = async () => {
    try {
        let date = moment(new Date('2024-04-23')).format("YYYY-MM-DD")
        const [company] = await mysql2.pool.query(`select ID, Name from company where Status = 1`)
        let result = []
        if (company) {
            result = JSON.parse(JSON.stringify(company))
        }

        if (result) {
           for(let data of result) {
                const [fetch] = await mysql2.pool.query(`select * from creport where Date = '${date}' and CompanyID = ${data.ID}`)
                let company_closing = await getInventory(data.ID, 0)
                let amt_company_closing = await getInventoryAmt(data.ID, 0)
                console.log(amt_company_closing, 'amt_company_closing');
                if (!fetch.length) {
                   const [save] = await mysql2.pool.query(`insert into creport(Date, CompanyID, ShopID, OpeningStock, AddPurchase, AddPreOrderPurchase, DeletePurchase, AddSale, DeleteSale, AddPreOrderSale, DeletePreOrderSale, AddManualSale, DeleteManualSale, OtherDeleteStock, InitiateTransfer, CancelTransfer, AcceptTransfer, ClosingStock, AmtOpeningStock, AmtAddPurchase, AmtAddPreOrderPurchase, AmtDeletePurchase, AmtAddSale, AmtDeleteSale, AmtAddPreOrderSale, AmtDeletePreOrderSale, AmtAddManualSale, AmtDeleteManualSale, AmtOtherDeleteStock, AmtInitiateTransfer, AmtCancelTransfer, AmtAcceptTransfer, AmtClosingStock)values('${date}', ${data.ID},0,${company_closing},0,0,0,0,0,0,0,0,0,0,0,0,0,${company_closing},'${amt_company_closing}',0,0,0,0,0,0,0,0,0,0,0,0,0,'${amt_company_closing}')`);

                   console.log(connected(`CompanyID : - ${data.ID}, Name:- ${data.Name} Created SuccessFully !!!!`));
                }

                const [fetchShop] = await mysql2.pool.query(`select ID, Name from shop where Status = 1 and CompanyID = ${data.ID}`)

                if (fetchShop.length) {

                    for(let item of fetchShop) {

                        const [fetchShopWise] = await mysql2.pool.query(`select * from creport where Date = '${date}' and CompanyID = ${data.ID} and ShopID = ${item.ID}`)

                        let shop_closing = await getInventory(data.ID, item.ID)
                        let amt_shop_closing = await getInventoryAmt(data.ID, item.ID)
                        console.log(amt_shop_closing, 'amt_shop_closing');

                        if (!fetchShopWise.length) {

                            const [save] = await mysql2.pool.query(`insert into creport(Date, CompanyID, ShopID, OpeningStock, AddPurchase, AddPreOrderPurchase, DeletePurchase, AddSale, DeleteSale, AddPreOrderSale, DeletePreOrderSale, AddManualSale, DeleteManualSale, OtherDeleteStock, InitiateTransfer, CancelTransfer, AcceptTransfer, ClosingStock, AmtOpeningStock, AmtAddPurchase, AmtAddPreOrderPurchase, AmtDeletePurchase, AmtAddSale, AmtDeleteSale, AmtAddPreOrderSale, AmtDeletePreOrderSale, AmtAddManualSale, AmtDeleteManualSale, AmtOtherDeleteStock, AmtInitiateTransfer, AmtCancelTransfer, AmtAcceptTransfer, AmtClosingStock)values('${date}', ${data.ID},${item.ID},${shop_closing},0,0,0,0,0,0,0,0,0,0,0,0,0,${shop_closing},'${amt_shop_closing}',0,0,0,0,0,0,0,0,0,0,0,0,0,'${amt_shop_closing}')`);

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
}
const c_report_init_set_opening_closing = async () => {
    try {
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
}


// c_report_init()
// c_report_init_set_opening_closing()
// product()
// init()
// product_support()