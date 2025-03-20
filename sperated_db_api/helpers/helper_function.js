const getConnection = require('../helpers/db')
const moment = require("moment");
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const mysql2 = require('../database')
const dbConfig = require('../helpers/db_config');

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

function discountAmount(item) {
  let discountAmount = 0
  discountAmount = (item.UnitPrice * 1) * item.DiscountPercentage / 100;
  return discountAmount
}

function gstAmount(SubTotal, GSTPercentage) {
  let gstAmount = 0
  gstAmount = (SubTotal * GSTPercentage) / 100
  return gstAmount
}
function calculateAmount(Amount, Percentage) {
  let modifyAmount = 0
  modifyAmount = (Amount * Percentage) / 100
  return modifyAmount
}

function discountAmount2(UnitPrice, DiscountPercentage, Qty) {
  let discountAmount = 0
  discountAmount = (UnitPrice * Qty) * DiscountPercentage / 100;
  return discountAmount
}
function shopID(header) {
  return Number(JSON.parse(header.selectedshop)[0])
}
module.exports = {
  dbConnection: async (req, res, next) => {
    const CompanyID = req?.user?.CompanyID || 0;
    // Check if the database instance is already cached
    
    if (dbCache[CompanyID]) {
      req.db = dbCache[CompanyID];
      return next();
    }

    // Fetch database connection
    const db = await dbConfig.dbByCompanyID(CompanyID);

    if (db.success === false) {
      // return db;
      return res.status(200).json(db);
    }

    // Store in cache
    dbCache[CompanyID] = db;
    req.db = db;
    next();
  },
  shopID: async (header) => {
    return Number(JSON.parse(header.selectedshop)[0])
  },
  Idd: async (req, res, next) => {
    let connection;
    try {
      const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
    const shopid = await shopID(req.headers) || 0;
    // const db = await dbConfig.dbByCompanyID(CompanyID);
    const db = await dbConnection(CompanyID)
    if (db.success === false) {
      return res.status(200).json(db);
    }
    connection = await db.getConnection();
    let shop = ``

    const [fetchCompanySetting] = await connection.query(`select CustomerShopWise from companysetting where CompanyID = ${CompanyID}`)

    if (fetchCompanySetting[0].CustomerShopWise === 'true') {
      shop = ` and ShopID = ${shopid}`
    }

    const [customer] = await connection.query(`select ID from customer where CompanyID = ${CompanyID}  ${shop}`);

    let Idd = customer.length
    return Idd + 1;
    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  generateVisitNo: async (CompanyID, CustomerID, TableName) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
    const db = await dbConnection(CompanyID)
    if (db.success === false) {
      return res.status(200).json(db);
    }
    connection = await db.getConnection();
    const [visitNo] = await connection.query(`select ID from ${TableName} where CompanyID = ${CompanyID} and CustomerID = ${CustomerID}`)

    return visitNo.length + 1;
    } catch (error) {
      console.log(error);
      
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  generateBarcode: async (CompanyID, BarcodeType) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
    const db = await dbConnection(CompanyID)
    if (db.success === false) {
      return res.status(200).json(db);
    }
    connection = await db.getConnection();
    const [barcode] = await connection.query(`select barcode.${BarcodeType} from barcode where Status = 1 and CompanyID=${CompanyID}`);
    if (BarcodeType === 'SB') {
      const [updateBarcode] = await connection.query(`update barcode set ${BarcodeType} = ${Number(barcode[0].SB) + 1}, UpdatedOn = now() where CompanyID=${CompanyID}`)
      return Number(barcode[0].SB)
    } else if (BarcodeType === 'PB') {
      const [updateBarcode] = await connection.query(`update barcode set ${BarcodeType} = ${Number(barcode[0].PB) + 1}, UpdatedOn = now() where CompanyID=${CompanyID}`)
      return Number(barcode[0].PB)
    } else if (BarcodeType === 'MB') {
      const [updateBarcode] = await connection.query(`update barcode set ${BarcodeType} = ${Number(barcode[0].MB) + 1}, UpdatedOn = now() where CompanyID=${CompanyID}`)
      return Number(barcode[0].MB)
    }
    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  doesExistProduct: async (CompanyID, Body) => {
    let connection;
    try {
      let qry = ``;
    // const db = await dbConfig.dbByCompanyID(CompanyID);
    const db = await dbConnection(CompanyID)
    if (db.success === false) {
      return res.status(200).json(db);
    }
    connection = await db.getConnection();
    if (CompanyID === 184 || CompanyID === "184") {
      qry = `SELECT MAX(BaseBarCode) AS MaxBarcode FROM purchasedetailnew WHERE ProductName = '${Body.ProductName}' AND ProductTypeName = '${Body.ProductTypeName}' AND purchasedetailnew.RetailPrice = ${Body.RetailPrice} AND purchasedetailnew.UnitPrice = ${Body.UnitPrice} AND purchasedetailnew.MultipleBarcode = ${Body.Multiple} AND purchasedetailnew.CompanyID = '${CompanyID}'AND purchasedetailnew.Status = 1 AND DATE_FORMAT(purchasedetailnew.CreatedOn,"%Y-%m-%d") >= '2024-06-07' `
    } else {
      qry = `SELECT MAX(BaseBarCode) AS MaxBarcode FROM purchasedetailnew WHERE ProductName = '${Body.ProductName}' AND ProductTypeName = '${Body.ProductTypeName}' AND purchasedetailnew.RetailPrice = ${Body.RetailPrice} AND purchasedetailnew.MultipleBarcode = ${Body.Multiple} AND purchasedetailnew.CompanyID = '${CompanyID}'AND purchasedetailnew.Status = 1`
      // qry = `SELECT MAX(BaseBarCode) AS MaxBarcode FROM purchasedetailnew WHERE ProductName = '${Body.ProductName}' AND ProductTypeName = '${Body.ProductTypeName}' AND purchasedetailnew.RetailPrice = ${Body.RetailPrice} AND purchasedetailnew.UnitPrice = ${Body.UnitPrice} AND purchasedetailnew.MultipleBarcode = ${Body.Multiple} AND purchasedetailnew.CompanyID = '${CompanyID}'AND purchasedetailnew.Status = 1`
    }


    const [barcode] = await connection.query(qry)
    return Number(barcode[0].MaxBarcode) ? Number(barcode[0].MaxBarcode) : 0
    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }

  },
  doesExistDiscoutSetting: async (CompanyID, ShopID, Body) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
    const db = await dbConnection(CompanyID)
    if (db.success === false) {
      return res.status(200).json(db);
    }
    connection = await db.getConnection();
    const [fetch] = await connection.query(`SELECT ID FROM discountsetting WHERE ProductName = '${Body.ProductName}' AND ProductTypeID = '${Body.ProductTypeID}' AND CompanyID = '${CompanyID}' AND ShopID = '${ShopID}' AND Status = 1`);
    if (fetch.length) {
      return true
    }
    return false
    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  doesExistDiscoutSettingUpdate: async (CompanyID, ShopID, ID, Body) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
    const db = await dbConnection(CompanyID)
    if (db.success === false) {
      return res.status(200).json(db);
    }
    connection = await db.getConnection();
    const [fetch] = await connection.query(`SELECT ID FROM discountsetting WHERE ProductName = '${Body.ProductName}' AND ProductTypeID = '${Body.ProductTypeID}' AND CompanyID = '${CompanyID}' AND ShopID = '${ShopID}' AND Status = 1 and ID != ${ID}`);
    if (fetch.length) {
      return true
    }
    return false
    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  doesExistProduct2: async (CompanyID, Body) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
    const db = await dbConnection(CompanyID)
    if (db.success === false) {
      return res.status(200).json(db);
    }
    connection = await db.getConnection();
    let qry = `SELECT MAX(BaseBarCode) AS MaxBarcode FROM purchasedetailnew WHERE ProductName = '${Body.ProductName}' AND ProductTypeName = '${Body.ProductTypeName}' AND purchasedetailnew.RetailPrice = ${Body.RetailPrice} AND purchasedetailnew.MultipleBarcode = ${Body.Multiple} AND purchasedetailnew.CompanyID = '${CompanyID}'AND purchasedetailnew.Status = 1 and purchasedetailnew.ID != ${Body.ID}`;
    // let qry = `SELECT MAX(BaseBarCode) AS MaxBarcode FROM purchasedetailnew WHERE ProductName = '${Body.ProductName}' AND ProductTypeName = '${Body.ProductTypeName}' AND purchasedetailnew.RetailPrice = ${Body.RetailPrice} AND purchasedetailnew.UnitPrice = ${Body.UnitPrice} AND purchasedetailnew.MultipleBarcode = ${Body.Multiple} AND purchasedetailnew.CompanyID = '${CompanyID}'AND purchasedetailnew.Status = 1 and purchasedetailnew.ID != ${Body.ID}`;

    const [barcode] = await connection.query(qry)
    return Number(barcode[0].MaxBarcode) ? Number(barcode[0].MaxBarcode) : 0
    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }

  },
  generateUniqueBarcode: async (CompanyID, SupplierID, Body) => {
    let connection;
   try {
     // const db = await dbConfig.dbByCompanyID(CompanyID);
     const db = await dbConnection(CompanyID)
     if (db.success === false) {
       return res.status(200).json(db);
     }
     connection = await db.getConnection();
     const [fetchcompanysetting] = await connection.query(`select year, month, partycode, type from companysetting where Status = 1 and CompanyID = ${CompanyID} `)
 
     let NewBarcode = ''; // blank initiate uniq barcode
     year = moment(new Date()).format('YY');
     month = moment(new Date()).format('MM');
     partycode = '0'
 
     const [fetchSupplier] = await connection.query(`select ID, Sno from supplier where Status = 1 and CompanyID = ${CompanyID} and ID = ${SupplierID}`)
 
     if (fetchSupplier.length) {
       if (fetchSupplier[0].Sno !== "" || fetchSupplier[0].Sno !== null || fetchSupplier[0].Sno !== undefined) {
         partycode = fetchSupplier[0].Sno
       }
     }
 
     const companysetting = fetchcompanysetting[0]
 
     if (companysetting.year == 'true') {
       NewBarcode = NewBarcode.concat(year);
     }
     if (companysetting.month == 'true') {
       NewBarcode = NewBarcode.concat(month);
 
     }
     if (companysetting.partycode === 'true') {
       NewBarcode = NewBarcode.concat(partycode);
     }
     if (companysetting.type === 'true' && Body.GSTType !== 'None' && Body.GSTPercentage !== 0) {
       NewBarcode = NewBarcode.concat("*");
     }
     if (companysetting.type === 'true' && Body.GSTType === 'None' && Body.GSTPercentage === 0) {
       NewBarcode = NewBarcode.concat("/");
     }
     NewBarcode = NewBarcode.concat(partycode);
     let unitpReverse = Body.UnitPrice.toString().split('').reverse().join('').toString();
     NewBarcode = NewBarcode.concat(unitpReverse);
     NewBarcode = NewBarcode.concat(partycode);
     // Body.UniqueBarcode = NewBarcode;
     return NewBarcode
   } catch (error) {
    console.log(error);
   } finally {
    if (connection) connection.release(); // Always release the connection
  }
  },
  generateUniqueBarcodePreOrder: async (CompanyID, Body) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
    const db = await dbConnection(CompanyID)
    if (db.success === false) {
      return res.status(200).json(db);
    }
    connection = await db.getConnection();
    const [fetchcompanysetting] = await connection.query(`select year, month, partycode, type from companysetting where Status = 1 and CompanyID = ${CompanyID} `)

    let NewBarcode = ''; // blank initiate uniq barcode
    year = moment(new Date()).format('YY');
    month = moment(new Date()).format('MM');
    partycode = '0'

    // const fetchSupplier = await connection.query(`select * from supplier where Status = 1 and CompanyID = ${CompanyID} and ID = ${SupplierID}`)

    const [fetchSupplier] = await connection.query(`select ID, Sno  from supplier where CompanyID = ${CompanyID} and Name = 'PreOrder Supplier'`)

    if (fetchSupplier.length) {
      if (fetchSupplier[0].Sno !== "" || fetchSupplier[0].Sno !== null || fetchSupplier[0].Sno !== undefined) {
        partycode = fetchSupplier[0].Sno
      }
    }

    const companysetting = fetchcompanysetting[0]

    if (companysetting.year == 'true') {
      NewBarcode = NewBarcode.concat(year);
    }
    if (companysetting.month == 'true') {
      NewBarcode = NewBarcode.concat(month);

    }
    if (companysetting.partycode === 'true') {
      NewBarcode = NewBarcode.concat(partycode);
    }
    if (companysetting.type === 'true' && Body.GSTType !== 'None' && Body.GSTPercentage !== 0) {
      NewBarcode = NewBarcode.concat("*");
    }
    if (companysetting.type === 'true' && Body.GSTType === 'None' && Body.GSTPercentage === 0) {
      NewBarcode = NewBarcode.concat("/");
    }
    NewBarcode = NewBarcode.concat(partycode);
    let unitpReverse = Body.PurchasePrice.toString().split('').reverse().join('').toString();
    NewBarcode = NewBarcode.concat(unitpReverse);
    NewBarcode = NewBarcode.concat(partycode);
    // Body.UniqueBarcode = NewBarcode;
    return NewBarcode
    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  gstDetail: async (CompanyID, PurchaseID) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
    const db = await dbConnection(CompanyID)
    if (db.success === false) {
      return res.status(200).json(db);
    }
    connection = await db.getConnection();
    let [gstTypes] = await connection.query(`select ID, Name, Status, TableName  from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)
    gstTypes = JSON.parse(JSON.stringify(gstTypes)) || []
    const values = []
    if (gstTypes.length) {
      for (const item of gstTypes) {
        let [value] = await connection.query(`select SUM(GSTAmount) as Amount, GSTType from purchasedetailnew where CompanyID = ${CompanyID} and PurchaseID = ${PurchaseID} and Status = 1 and GSTType = '${item.Name}'`)
        value = JSON.parse(JSON.stringify(value)) || []
        if (value.length) {
          if ((item.Name).toUpperCase() === 'CGST-SGST') {
            values.push(
              {
                GSTType: `CGST`,
                Amount: Number(value[0].Amount) / 2
              },
              {
                GSTType: `SGST`,
                Amount: Number(value[0].Amount) / 2
              }
            )
          } else if (value[0].Amount !== null) {
            values.push({
              GSTType: `${item.Name}`,
              Amount: Number(value[0].Amount)
            })
          } else if (value[0].Amount === null) {
            values.push({
              GSTType: `${item.Name}`,
              Amount: 0
            })
          }
        }
      }
    }

    const values2 = []
    if (gstTypes.length) {
      for (const item of gstTypes) {
        let [value] = await connection.query(`select SUM(GSTAmount) as Amount, GSTType from purchasecharge where CompanyID = ${CompanyID} and PurchaseID = ${PurchaseID} and Status = 1 and GSTType = '${item.Name}'`)
        value = JSON.parse(JSON.stringify(value)) || []
        if (value.length) {
          if ((item.Name).toUpperCase() === 'CGST-SGST') {
            values2.push(
              {
                GSTType: `CGST`,
                Amount: Number(value[0].Amount) / 2
              },
              {
                GSTType: `SGST`,
                Amount: Number(value[0].Amount) / 2
              }
            )
          } else if (value[0].Amount !== null) {
            values2.push({
              GSTType: `${item.Name}`,
              Amount: Number(value[0].Amount)
            })
          } else if (value[0].Amount === null) {
            values2.push({
              GSTType: `${item.Name}`,
              Amount: 0
            })
          }
        }
      }
    }

    if (values.length && values2.length) {
      values.forEach(e => {
        values2.forEach(el => {
          if (e.GSTType === el.GSTType) {
            e.Amount = Number(e.Amount) + Number(el.Amount)
          }
        })
      })
    }
    return values
    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  gstDetailQuotation: async (CompanyID, PurchaseID) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
    const db = await dbConnection(CompanyID)
    if (db.success === false) {
      return res.status(200).json(db);
    }
    connection = await db.getConnection();
    let [gstTypes] = await connection.query(`select ID, Name, Status, TableName from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)
    gstTypes = JSON.parse(JSON.stringify(gstTypes)) || []
    const values = []
    if (gstTypes.length) {
      for (const item of gstTypes) {
        let [value] = await connection.query(`select SUM(GSTAmount) as Amount, GSTType from purchasedetailnewpo where CompanyID = ${CompanyID} and PurchaseID = ${PurchaseID} and Status = 1 and GSTType = '${item.Name}'`)
        value = JSON.parse(JSON.stringify(value)) || []
        if (value.length) {
          if ((item.Name).toUpperCase() === 'CGST-SGST') {
            values.push(
              {
                GSTType: `CGST`,
                Amount: Number(value[0].Amount) / 2
              },
              {
                GSTType: `SGST`,
                Amount: Number(value[0].Amount) / 2
              }
            )
          } else if (value[0].Amount !== null) {
            values.push({
              GSTType: `${item.Name}`,
              Amount: Number(value[0].Amount)
            })
          } else if (value[0].Amount === null) {
            values.push({
              GSTType: `${item.Name}`,
              Amount: 0
            })
          }
        }
      }
    }
    return values
    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  gstDetailBill: async (CompanyID, BillID) => {
    let connection;
   try {
     // const db = await dbConfig.dbByCompanyID(CompanyID);
     const db = await dbConnection(CompanyID)
     if (db.success === false) {
       return res.status(200).json(db);
     }
     connection = await db.getConnection();
     let [gstTypes] = await connection.query(`select ID, Name, Status, TableName  from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)
     gstTypes = JSON.parse(JSON.stringify(gstTypes)) || []
     const values = []
     if (gstTypes.length) {
       for (const item of gstTypes) {
         let [value] = await connection.query(`select SUM(GSTAmount) as Amount, GSTType from billdetail where CompanyID = ${CompanyID} and BillID = ${BillID} and Status = 1 and GSTType = '${item.Name}'`)
         value = JSON.parse(JSON.stringify(value)) || []
         if (value.length) {
           if ((item.Name).toUpperCase() === 'CGST-SGST') {
             values.push(
               {
                 GSTType: `CGST`,
                 Amount: Number(value[0].Amount) / 2
               },
               {
                 GSTType: `SGST`,
                 Amount: Number(value[0].Amount) / 2
               }
             )
           } else if (value[0].Amount !== null) {
             values.push({
               GSTType: `${item.Name}`,
               Amount: Number(value[0].Amount).toFixed(2)
             })
           } else if (value[0].Amount === null) {
             values.push({
               GSTType: `${item.Name}`,
               Amount: 0
             })
           }
         }
       }
     }
 
     const values2 = []
     if (gstTypes.length) {
       for (const item of gstTypes) {
         let [value] = await connection.query(`select SUM(GSTAmount) as Amount, GSTType from billservice where CompanyID = ${CompanyID} and BillID = ${BillID} and Status = 1 and GSTType = '${item.Name}'`)
         value = JSON.parse(JSON.stringify(value)) || []
         if (value.length) {
           if ((item.Name).toUpperCase() === 'CGST-SGST') {
             values2.push(
               {
                 GSTType: `CGST`,
                 Amount: Number(value[0].Amount) / 2
               },
               {
                 GSTType: `SGST`,
                 Amount: Number(value[0].Amount) / 2
               }
             )
           } else if (value[0].Amount !== null) {
             values2.push({
               GSTType: `${item.Name}`,
               Amount: Number(value[0].Amount)
             })
           } else if (value[0].Amount === null) {
             values2.push({
               GSTType: `${item.Name}`,
               Amount: 0
             })
           }
         }
       }
     }
 
     if (values.length && values2.length) {
       values.forEach(e => {
         values2.forEach(el => {
           if (e.GSTType === el.GSTType) {
             e.Amount = Number(e.Amount) + Number(el.Amount)
           }
         })
       })
     }
     return values
   } catch (error) {
    console.log(error);
   } finally {
    if (connection) connection.release(); // Always release the connection
  }
  },
  discountAmount: async (item) => {
    let discountAmount = 0
    discountAmount = (item.UnitPrice * item.Quantity) * item.DiscountPercentage / 100;
    return discountAmount
  },
  discountAmount2: async (UnitPrice, DiscountPercentage, Qty) => {
    let discountAmount = 0
    discountAmount = (UnitPrice * Qty) * DiscountPercentage / 100;
    return discountAmount
  },
  gstAmount: async (SubTotal, GSTPercentage) => {
    let gstAmount = 0
    gstAmount = (SubTotal * GSTPercentage) / 100
    return gstAmount
  },
  generateInvoiceNo: async (CompanyID, ShopID, billDetailData, billMaseterData) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
    const db = await dbConnection(CompanyID)
    if (db.success === false) {
      return res.status(200).json(db);
    }
    connection = await db.getConnection();
    let rw = "W";
    let billShopWiseBoolean = false
    let newInvoiceID = new Date();
    if (billMaseterData.ID === null || billMaseterData.ID === undefined) {
      newInvoiceID = new Date().toISOString().replace(/[`~!@#$%^&*()_|+\-=?TZ;:'",.<>\{\}\[\]\\\/]/gi, "").substring(2, 6);
    }
    if (billDetailData.length !== 0 && !billDetailData[0].WholeSale) {
      rw = "R";
    }
    const [billShopWise] = await connection.query(`select ID, BillShopWise from shop where CompanyID = ${CompanyID} and ID = ${ShopID} and Status = 1`);
    if (billShopWise.length) {
      if (billShopWise[0].BillShopWise == true || billShopWise[0].BillShopWise == "true") {
        billShopWiseBoolean = true
      } else {
        billShopWiseBoolean = false
      }
    }

    let lastInvoiceID = []

    if (billShopWiseBoolean) {
      [lastInvoiceID] = await connection.query(`select Retail, WholeSale  from invoice WHERE CompanyID = '${CompanyID}' and ShopID = ${ShopID}`);

      const updateDatum = {
        Retail: rw === "R" ? lastInvoiceID[0].Retail + 1 : lastInvoiceID[0].Retail,
        WholeSale: rw === "W" ? lastInvoiceID[0].WholeSale + 1 : lastInvoiceID[0].WholeSale,
      }

      const [update] = await connection.query(`update invoice set Retail = ${updateDatum.Retail}, WholeSale = ${updateDatum.WholeSale}, UpdatedOn = now() WHERE CompanyID = '${CompanyID}' and ShopID = ${ShopID}`)

    } else {
      [lastInvoiceID] = await connection.query(`select Retail, WholeSale from invoice WHERE CompanyID = '${CompanyID}' and ShopID = 0`);

      const updateDatum = {
        Retail: rw === "R" ? lastInvoiceID[0].Retail + 1 : lastInvoiceID[0].Retail,
        WholeSale: rw === "W" ? lastInvoiceID[0].WholeSale + 1 : lastInvoiceID[0].WholeSale,
      }

      const [update] = await connection.query(`update invoice set Retail = ${updateDatum.Retail}, WholeSale = ${updateDatum.WholeSale}, UpdatedOn = now() WHERE CompanyID = '${CompanyID}' and ShopID = 0`)
    }

    const [shopDetails] = await connection.query(`select ID, Sno from shop where CompanyID = ${CompanyID} and ID = ${ShopID} and Status = 1`)

    if (lastInvoiceID) {
      newInvoiceID = newInvoiceID + "-" + rw + ShopID + "-" + shopDetails[0].Sno + "-" + (rw === "R" ? lastInvoiceID[0].Retail : lastInvoiceID[0].WholeSale);

    }

    return newInvoiceID
    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  generateInvoiceNoForService: async (CompanyID, ShopID, billDetailData, billMaseterData) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
    const db = await dbConnection(CompanyID)
    if (db.success === false) {
      return res.status(200).json(db);
    }
    connection = await db.getConnection();
    let rw = "S";
    let billShopWiseBoolean = false
    let newInvoiceID = new Date();
    if (billMaseterData.ID === null || billMaseterData.ID === undefined) {
      newInvoiceID = new Date().toISOString().replace(/[`~!@#$%^&*()_|+\-=?TZ;:'",.<>\{\}\[\]\\\/]/gi, "").substring(2, 6);
    }

    const [billShopWise] = await connection.query(`select ID, BillShopWise from shop where CompanyID = ${CompanyID} and ID = ${ShopID} and Status = 1`);
    if (billShopWise.length) {
      if (billShopWise[0].BillShopWise == true || billShopWise[0].BillShopWise == "true") {
        billShopWiseBoolean = true
      } else {
        billShopWiseBoolean = false
      }
    }

    let lastInvoiceID = []

    if (billShopWiseBoolean) {
      [lastInvoiceID] = await connection.query(`select Service from invoice WHERE CompanyID = '${CompanyID}' and ShopID = ${ShopID}`);

      const updateDatum = {
        Service: lastInvoiceID[0].Service + 1
      }

      const [update] = await connection.query(`update invoice set Service = ${updateDatum.Service}, UpdatedOn = now() WHERE CompanyID = '${CompanyID}' and ShopID = ${ShopID}`)

    } else {
      [lastInvoiceID] = await connection.query(`select Service from invoice WHERE CompanyID = '${CompanyID}' and ShopID = 0`);

      const updateDatum = {
        Service: lastInvoiceID[0].Service + 1
      }

      const [update] = await connection.query(`update invoice set Service = ${updateDatum.Service}, UpdatedOn = now() WHERE CompanyID = '${CompanyID}' and ShopID = 0`)
    }

    const [shopDetails] = await connection.query(`select ID, Sno from shop where CompanyID = ${CompanyID} and ID = ${ShopID} and Status = 1`)

    if (lastInvoiceID) {
      newInvoiceID = newInvoiceID + "-" + rw + ShopID + "-" + shopDetails[0].Sno + "-" + lastInvoiceID[0].Service;

    }

    return newInvoiceID
    } catch (error) {
      console.log(error); 
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  generateInvoiceNo2: async (CompanyID, ShopID, billDetailData, billMaseterData) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
    const db = await dbConnection(CompanyID)
    if (db.success === false) {
      return res.status(200).json(db);
    }
    connection = await db.getConnection();
    let rw = "W";
    let billShopWiseBoolean = false
    let newInvoiceID = new Date();
    if (billMaseterData.ID === null || billMaseterData.ID === undefined) {
      newInvoiceID = new Date().toISOString().replace(/[`~!@#$%^&*()_|+\-=?TZ;:'",.<>\{\}\[\]\\\/]/gi, "").substring(2, 6);
    }
    if (billDetailData.length !== 0 && !billDetailData[0].WholeSale) {
      rw = "R";
    }
    const [billShopWise] = await connection.query(`select ID, BillShopWise from shop where CompanyID = ${CompanyID}`);
    if (billShopWise.length) {
      if (billShopWise[0].BillShopWise == true || billShopWise[0].BillShopWise == "true") {
        billShopWiseBoolean = true
      } else {
        billShopWiseBoolean = false
      }
    }

    let lastInvoiceID = []
    // and InvoiceNo LIKE '${newInvoiceID}%'
    // and InvoiceNo LIKE '${newInvoiceID}%'
    if (billShopWiseBoolean) {
      [lastInvoiceID] = await connection.query(`SELECT ID ,InvoiceNo FROM billmaster WHERE ID IN (SELECT MAX(ID) AS MaxID FROM billmaster WHERE CompanyID = '${CompanyID}' and ShopID = ${ShopID} and BillType = 1 )`);
    } else {
      [lastInvoiceID] = await connection.query(`SELECT ID ,InvoiceNo FROM billmaster WHERE ID IN (SELECT MAX(ID) AS MaxID FROM billmaster WHERE CompanyID = '${CompanyID}' and BillType = 1 )`);
    }

    const [shopDetails] = await connection.query(`select ID, Sno from shop where CompanyID = ${CompanyID} and ID = ${ShopID} and Status = 1`)

    if (lastInvoiceID.length === 0 || lastInvoiceID[0].MaxID === null
    ) {
      // || lastInvoiceID[0].InvoiceNo.substring(0, 4) !== newInvoiceID
      newInvoiceID = newInvoiceID + "-" + rw + shopDetails[0].Sno + "-" + "1";
    } else {
      let temp3 = lastInvoiceID[0].InvoiceNo.split("-");
      let temp1 = parseInt(temp3[temp3.length - 1]) + 1;
      let temp2 = temp1;
      newInvoiceID = newInvoiceID + "-" + rw + shopDetails[0].Sno + "-" + temp2
      // .slice(-5);
    }

    return newInvoiceID
    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  generateInvoiceNoForService2: async (CompanyID, ShopID, billDetailData, billMaseterData) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
    const db = await dbConnection(CompanyID)
    if (db.success === false) {
      return res.status(200).json(db);
    }
    connection = await db.getConnection();
    let rw = "S";
    let billShopWiseBoolean = false
    let newInvoiceID = new Date();
    if (billMaseterData.ID === null || billMaseterData.ID === undefined) {
      newInvoiceID = new Date().toISOString().replace(/[`~!@#$%^&*()_|+\-=?TZ;:'",.<>\{\}\[\]\\\/]/gi, "").substring(2, 6);
    }

    const [billShopWise] = await connection.query(`select ID, BillShopWise from shop where CompanyID = ${CompanyID}`);
    if (billShopWise.length) {
      if (billShopWise[0].BillShopWise == true || billShopWise[0].BillShopWise == "true") {
        billShopWiseBoolean = true
      } else {
        billShopWiseBoolean = false
      }
    }

    let lastInvoiceID = []

    if (billShopWiseBoolean) {
      [lastInvoiceID] = await connection.query(`SELECT ID ,InvoiceNo FROM billmaster WHERE ID IN (SELECT MAX(ID) AS MaxID FROM billmaster WHERE CompanyID = '${CompanyID}' and ShopID = ${ShopID} and BillType = 0  )`);
    } else {
      [lastInvoiceID] = await connection.query(`SELECT ID ,InvoiceNo FROM billmaster WHERE ID IN (SELECT MAX(ID) AS MaxID FROM billmaster WHERE CompanyID = '${CompanyID}' and BillType = 0  )`);
    }

    const [shopDetails] = await connection.query(`select ID, Sno from shop where CompanyID = ${CompanyID} and ID = ${ShopID} and Status = 1`)

    if (lastInvoiceID.length === 0 || lastInvoiceID[0].MaxID === null
    ) {
      // || lastInvoiceID[0].InvoiceNo.substring(0, 4) !== newInvoiceID
      newInvoiceID = newInvoiceID + "-" + rw + shopDetails[0].Sno + "-" + "1";
    } else {
      let temp3 = lastInvoiceID[0].InvoiceNo.split("-");
      let temp1 = parseInt(temp3[temp3.length - 1]) + 1;
      let temp2 = temp1;
      newInvoiceID = newInvoiceID + "-" + rw + shopDetails[0].Sno + "-" + temp2;
      // .slice(-5)
    }

    return newInvoiceID
    } catch (error) {
      console.log(error); 
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  generateBillSno: async (CompanyID, ShopID) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
    const db = await dbConnection(CompanyID)
    if (db.success === false) {
      return res.status(200).json(db);
    }
    connection = await db.getConnection();
    const [sNo] = await connection.query(`select ID from billmaster where CompanyID = ${CompanyID} and ShopID = ${ShopID}`)

    return sNo.length + 1;
    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  // generateCommission: async (CompanyID, UserType, UserID, bMasterID, billMaseterData, LoggedOnUser) => {
  //   try {
  //     let commission = { Type: 0, Mode: 0, Value: 0, Amount: 0, BrandedCommissionAmount: 0, NonBrandedCommissionAmount: 0 }
  //     let commission1 = { Type: 0, Mode: 0, Value: 0, Amount: 0, BrandedCommissionAmount: 0, NonBrandedCommissionAmount: 0 }

  //     if (UserType === 'Employee') {
  //       let [userData] = await db.query(`select * from user where user.ID = ${UserID}`);
  //       if (userData.length !== 0 && userData[0].CommissionType == 1) {
  //         commission1.Type = userData[0].CommissionType;
  //         if (userData[0].CommissionMode == 2) {
  //           commission1.Amount = userData[0].CommissionValue;
  //           commission1.Mode = userData[0].CommissionMode;
  //           commission1.Value = userData[0].CommissionValue;
  //         } else if (userData[0].CommissionMode == 1) {
  //           commission1.Type = userData[0].CommissionType;
  //           commission1.Amount = +billMaseterData.SubTotal * +userData[0].CommissionValue / 100;
  //           commission1.Mode = userData[0].CommissionMode;
  //           commission1.Value = userData[0].CommissionValue;
  //         }
  //       } else if (userData.length !== 0 && userData[0].CommissionType == 2) {
  //         let [userResultB] = await db.query(`SELECT SUM(billdetail.SubTotal) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND purchasedetailnew.BrandType = 1`);
  //         let [userResultNB] = await db.query(`SELECT SUM(billdetail.SubTotal) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND purchasedetailnew.BrandType <> 1`);
  //         commission1.Type = userData[0].CommissionType;
  //         if (userData[0].CommissionMode == 2) {
  //           // commission1.Amount = subTotal;
  //           // commission1.Mode = userData[0].CommissionMode;
  //           // commission1.Value = userData[0].CommissionValue;
  //         } else if (userData[0].CommissionMode == 1) {
  //           commission1.Type = userData[0].CommissionType;
  //           commission1.Amount = userResultB[0].SubTotalVal * +userData[0].CommissionValue / 100 + userResultNB[0].SubTotalVal * +userData[0].CommissionValueNB / 100;
  //           commission1.Mode = userData[0].CommissionMode;
  //           commission1.Value = userData[0].CommissionValue;
  //           commission1.BrandedCommissionAmount = userResultB[0].SubTotalVal * +userData[0].CommissionValue / 100;
  //           commission1.NonBrandedCommissionAmount = userResultNB[0].SubTotalVal * +userData[0].CommissionValueNB / 100;
  //         }
  //       }

  //       if (commission1.Type !== 0 && commission1.Amount !== 0) {
  //         const [save] = await db.query(`insert into commissiondetail (CompanyID,ShopID,CommissionMasterID, UserType, UserID,BillMasterID, CommissionMode, CommissionType, CommissionValue, CommissionAmount, BrandedCommissionAmount, NonBrandedCommissionAmount, Status,CreatedBy,CreatedOn ) values (${CompanyID}, ${billMaseterData.ShopID}, 0,'Employee', ${userData[0].ID}, ${bMasterID}, ${commission1.Mode},${commission1.Type},${commission1.Value},${commission1.Amount},${commission1.BrandedCommissionAmount},${commission1.NonBrandedCommissionAmount}, 1, '${LoggedOnUser}', now())`)
  //         console.log(save);
  //       }
  //     } else if (UserType === 'Doctor') {
  //       let [doctorData] = await db.query(`select * from doctor where doctor.ID = ${UserID}`);
  //       if (doctorData.length !== 0 && doctorData[0].CommissionType == 1) {
  //         commission.Type = doctorData[0].CommissionType;
  //         if (doctorData[0].CommissionMode == 2) {
  //           commission.Amount = doctorData[0].CommissionValue;
  //           commission.Mode = doctorData[0].CommissionMode;
  //           commission.Value = doctorData[0].CommissionValue;
  //         } else if (doctorData[0].CommissionMode == 1) {
  //           commission.Type = doctorData[0].CommissionType;
  //           commission.Amount = +billMaseterData.SubTotal * +doctorData[0].CommissionValue / 100;
  //           commission.Mode = doctorData[0].CommissionMode;
  //           commission.Value = doctorData[0].CommissionValue;
  //         }
  //       } else if (doctorData.length !== 0 && doctorData[0].CommissionType == 2) {
  //         let [doctorResultB] = await db.query(`SELECT SUM(billdetail.SubTotal) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND BrandType = 1`);
  //         let [doctorResultNB] = await db.query(`SELECT SUM(billdetail.SubTotal) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND BrandType <> 1`);
  //         commission.Type = doctorData[0].CommissionType;
  //         if (doctorData[0].CommissionMode == 2) {
  //           // commission.Amount = subTotal;
  //           // commission.Mode = doctorData[0].CommissionMode;
  //           // commission.Value = doctorData[0].CommissionValue;
  //         } else if (doctorData[0].CommissionMode == 1) {
  //           commission.Type = doctorData[0].CommissionType;
  //           commission.Amount = doctorResultB[0].SubTotalVal * +doctorData[0].CommissionValue / 100 + doctorResultNB[0].SubTotalVal * +doctorData[0].CommissionValueNB / 100;
  //           commission.Mode = doctorData[0].CommissionMode;
  //           commission.Value = doctorData[0].CommissionValue;
  //           commission.BrandedCommissionAmount = doctorResultB[0].SubTotalVal * +doctorData[0].CommissionValue / 100;
  //           commission.NonBrandedCommissionAmount = doctorResultNB[0].SubTotalVal * +doctorData[0].CommissionValueNB / 100;
  //         }
  //       }

  //       if (commission.Type !== 0 && commission.Amount !== 0) {
  //         await db.query(`insert into commissiondetail (CompanyID,ShopID,CommissionMasterID, UserType, UserID,BillMasterID, CommissionMode, CommissionType, CommissionValue, CommissionAmount,BrandedCommissionAmount,NonBrandedCommissionAmount, Status,CreatedBy,CreatedOn ) values (${CompanyID}, ${billMaseterData.ShopID}, 0,'Doctor', ${billMaseterData.Doctor}, ${bMasterID}, ${commission.Mode},${commission.Type},${commission.Value},${commission.Amount},${commission.BrandedCommissionAmount},${commission.NonBrandedCommissionAmount},1,${LoggedOnUser}, now())`)
  //       }
  //     }
  //     return
  //   } catch (error) {
  //     next(error)
  //     console.log(error);
  //   }


  // },
  // updateCommission: async (CompanyID, UserType, UserID, bMasterID, billMaseterData, LoggedOnUser) => {
  //   try {
  //     let commission = { Type: 0, Mode: 0, Value: 0, Amount: 0, BrandedCommissionAmount: 0, NonBrandedCommissionAmount: 0 }
  //     let commission1 = { Type: 0, Mode: 0, Value: 0, Amount: 0, BrandedCommissionAmount: 0, NonBrandedCommissionAmount: 0 }

  //     if (UserType === 'Employee') {
  //       let [userData] = await db.query(`select * from user where user.ID = ${UserID}`);
  //       if (userData.length !== 0 && userData[0].CommissionType == 1) {
  //         commission1.Type = userData[0].CommissionType;
  //         if (userData[0].CommissionMode == 2) {
  //           commission1.Amount = userData[0].CommissionValue;
  //           commission1.Mode = userData[0].CommissionMode;
  //           commission1.Value = userData[0].CommissionValue;
  //         } else if (userData[0].CommissionMode == 1) {
  //           commission1.Type = userData[0].CommissionType;
  //           commission1.Amount = +billMaseterData.SubTotal * +userData[0].CommissionValue / 100;
  //           commission1.Mode = userData[0].CommissionMode;
  //           commission1.Value = userData[0].CommissionValue;
  //         }
  //       } else if (userData.length !== 0 && userData[0].CommissionType == 2) {
  //         let [userResultB] = await db.query(`SELECT ROUND(SUM(billdetail.SubTotal), 2)as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND purchasedetailnew.BrandType = 1`);
  //         let [userResultNB] = await db.query(`SELECT ROUND(SUM(billdetail.SubTotal), 2) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND purchasedetailnew.BrandType <> 1`);


  //         commission1.Type = userData[0].CommissionType;
  //         if (userData[0].CommissionMode == 2) {
  //           // commission1.Amount = subTotal;
  //           // commission1.Mode = userData[0].CommissionMode;
  //           // commission1.Value = userData[0].CommissionValue;
  //         } else if (userData[0].CommissionMode == 1) {
  //           commission1.Type = userData[0].CommissionType;
  //           commission1.Amount = userResultB[0].SubTotalVal * +userData[0].CommissionValue / 100 + userResultNB[0].SubTotalVal * +userData[0].CommissionValueNB / 100;
  //           commission1.Mode = userData[0].CommissionMode;
  //           commission1.Value = userData[0].CommissionValue;
  //           commission1.BrandedCommissionAmount = userResultB[0].SubTotalVal * +userData[0].CommissionValue / 100;
  //           commission1.NonBrandedCommissionAmount = userResultNB[0].SubTotalVal * +userData[0].CommissionValueNB / 100;
  //         }
  //       }

  //       if (commission1.Type !== 0 && commission1.Amount !== 0) {
  //         // const [save] = await db.query(`insert into commissiondetail (CompanyID,ShopID,CommissionMasterID, UserType, UserID,BillMasterID, CommissionMode, CommissionType, CommissionValue, CommissionAmount, BrandedCommissionAmount, NonBrandedCommissionAmount, Status,CreatedBy,CreatedOn ) values (${CompanyID}, ${billMaseterData.ShopID}, 0,'Employee', ${userData[0].ID}, ${bMasterID}, ${commission1.Mode},${commission1.Type},${commission1.Value},${commission1.Amount},${commission1.BrandedCommissionAmount},${commission1.NonBrandedCommissionAmount}, 1, '${LoggedOnUser}', now())`)



  //         const [update] = await db.query(`update commissiondetail set CommissionMode = ${commission1.Mode}, CommissionType = ${commission1.Type}, CommissionValue = ${commission1.Value}, CommissionAmount = ${commission1.Amount}, BrandedCommissionAmount = ${commission1.BrandedCommissionAmount}, NonBrandedCommissionAmount = ${commission1.NonBrandedCommissionAmount}, UpdatedOn = now(), UpdatedBy = ${LoggedOnUser} where BillmasterID = ${bMasterID} and UserType = 'Employee' and UserID = ${userData[0].ID} and CompanyID = ${CompanyID}`)
  //       }
  //     } else if (UserType === 'Doctor') {
  //       let [doctorData] = await db.query(`select * from doctor where doctor.ID = ${UserID}`);
  //       if (doctorData.length !== 0 && doctorData[0].CommissionType == 1) {
  //         commission.Type = doctorData[0].CommissionType;
  //         if (doctorData[0].CommissionMode == 2) {
  //           commission.Amount = doctorData[0].CommissionValue;
  //           commission.Mode = doctorData[0].CommissionMode;
  //           commission.Value = doctorData[0].CommissionValue;
  //         } else if (doctorData[0].CommissionMode == 1) {
  //           commission.Type = doctorData[0].CommissionType;
  //           commission.Amount = +billMaseterData.SubTotal * +doctorData[0].CommissionValue / 100;
  //           commission.Mode = doctorData[0].CommissionMode;
  //           commission.Value = doctorData[0].CommissionValue;
  //         }
  //       } else if (doctorData.length !== 0 && doctorData[0].CommissionType == 2) {
  //         let [doctorResultB] = await db.query(`SELECT ROUND(SUM(billdetail.SubTotal), 2) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND BrandType = 1`);
  //         let [doctorResultNB] = await db.query(`SELECT ROUND(SUM(billdetail.SubTotal), 2) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND BrandType <> 1`);
  //         commission.Type = doctorData[0].CommissionType;
  //         if (doctorData[0].CommissionMode == 2) {
  //           // commission.Amount = subTotal;
  //           // commission.Mode = doctorData[0].CommissionMode;
  //           // commission.Value = doctorData[0].CommissionValue;
  //         } else if (doctorData[0].CommissionMode == 1) {
  //           commission.Type = doctorData[0].CommissionType;
  //           commission.Amount = doctorResultB[0].SubTotalVal * +doctorData[0].CommissionValue / 100 + doctorResultNB[0].SubTotalVal * +doctorData[0].CommissionValueNB / 100;
  //           commission.Mode = doctorData[0].CommissionMode;
  //           commission.Value = doctorData[0].CommissionValue;
  //           commission.BrandedCommissionAmount = doctorResultB[0].SubTotalVal * +doctorData[0].CommissionValue / 100;
  //           commission.NonBrandedCommissionAmount = doctorResultNB[0].SubTotalVal * +doctorData[0].CommissionValueNB / 100;
  //         }
  //       }

  //       if (commission.Type !== 0 && commission.Amount !== 0) {
  //         // await db.query(`insert into commissiondetail (CompanyID,ShopID,CommissionMasterID, UserType, UserID,BillMasterID, CommissionMode, CommissionType, CommissionValue, CommissionAmount,BrandedCommissionAmount,NonBrandedCommissionAmount, Status,CreatedBy,CreatedOn ) values (${CompanyID}, ${billMaseterData.ShopID}, 0,'Doctor', ${billMaseterData.Doctor}, ${bMasterID}, ${commission.Mode},${commission.Type},${commission.Value},${commission.Amount},${commission.BrandedCommissionAmount},${commission.NonBrandedCommissionAmount},1,${LoggedOnUser}, now())`)

  //         const [update] = await db.query(`update commissiondetail set CommissionMode = ${commission.Mode}, CommissionType = ${commission.Type}, CommissionValue = ${commission.Value}, CommissionAmount = ${commission.Amount}, BrandedCommissionAmount = ${commission.BrandedCommissionAmount}, NonBrandedCommissionAmount = ${commission.NonBrandedCommissionAmount}, UpdatedOn = now(), UpdatedBy = ${LoggedOnUser} where BillmasterID = ${bMasterID} and UserType = 'Doctor' and UserID = ${doctorData[0].ID} and CompanyID = ${CompanyID}`)
  //       }
  //     }
  //     return
  //   } catch (error) {
  //     console.log(error);
  //   }


  // },
  generateCommission: async (CompanyID, UserType, UserID, bMasterID, billMaseterData, LoggedOnUser) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
      const db = await dbConnection(CompanyID)
      if (db.success === false) {
        return res.status(200).json(db);
      }
      connection = await db.getConnection();

      let commission = { Type: 0, Mode: 0, Value: 0, Amount: 0, BrandedCommissionAmount: 0, NonBrandedCommissionAmount: 0 };
      let commission1 = { Type: 0, Mode: 0, Value: 0, Amount: 0, BrandedCommissionAmount: 0, NonBrandedCommissionAmount: 0 };

      if (UserType === 'Employee') {
        let [userData] = await connection.query(`select * from user where user.ID = ${UserID}`);
        if (userData.length !== 0 && userData[0].CommissionType == 1) {
          commission1.Type = userData[0].CommissionType;
          if (userData[0].CommissionMode == 2) {
            commission1.Amount = userData[0].CommissionValue;
            commission1.Mode = userData[0].CommissionMode;
            commission1.Value = userData[0].CommissionValue;
          } else if (userData[0].CommissionMode == 1) {
            commission1.Type = userData[0].CommissionType;
            commission1.Amount = (+billMaseterData.SubTotal * +userData[0].CommissionValue / 100).toFixed(2);
            commission1.Mode = userData[0].CommissionMode;
            commission1.Value = userData[0].CommissionValue;
          }
        } else if (userData.length !== 0 && userData[0].CommissionType == 2) {
          let [userResultB] = await connection.query(`SELECT SUM(billdetail.SubTotal) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND purchasedetailnew.BrandType = 1`);
          let [userResultNB] = await connection.query(`SELECT SUM(billdetail.SubTotal) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND purchasedetailnew.BrandType <> 1`);
          commission1.Type = userData[0].CommissionType;
          if (userData[0].CommissionMode == 1) {
            commission1.Type = userData[0].CommissionType;
            commission1.Amount = ((userResultB[0].SubTotalVal * +userData[0].CommissionValue / 100) + (userResultNB[0].SubTotalVal * +userData[0].CommissionValueNB / 100)).toFixed(2);
            commission1.Mode = userData[0].CommissionMode;
            commission1.Value = userData[0].CommissionValue;
            commission1.BrandedCommissionAmount = (userResultB[0].SubTotalVal * +userData[0].CommissionValue / 100).toFixed(2);
            commission1.NonBrandedCommissionAmount = (userResultNB[0].SubTotalVal * +userData[0].CommissionValueNB / 100).toFixed(2);
          }
        }

        if (commission1.Type !== 0 && commission1.Amount !== 0) {
          const [save] = await connection.query(`insert into commissiondetail (CompanyID,ShopID,CommissionMasterID, UserType, UserID,BillMasterID, CommissionMode, CommissionType, CommissionValue, CommissionAmount, BrandedCommissionAmount, NonBrandedCommissionAmount, Status,CreatedBy,CreatedOn ) values (${CompanyID}, ${billMaseterData.ShopID}, 0,'Employee', ${userData[0].ID}, ${bMasterID}, ${commission1.Mode},${commission1.Type},${commission1.Value},${commission1.Amount},${commission1.BrandedCommissionAmount},${commission1.NonBrandedCommissionAmount}, 1, '${LoggedOnUser}', now())`);
          console.log(save);
        }
      } else if (UserType === 'Doctor') {
        let [doctorData] = await connection.query(`select * from doctor where doctor.ID = ${UserID}`);
        if (doctorData.length !== 0 && doctorData[0].CommissionType == 1) {
          commission.Type = doctorData[0].CommissionType;
          if (doctorData[0].CommissionMode == 2) {
            commission.Amount = doctorData[0].CommissionValue;
            commission.Mode = doctorData[0].CommissionMode;
            commission.Value = doctorData[0].CommissionValue;
          } else if (doctorData[0].CommissionMode == 1) {
            commission.Type = doctorData[0].CommissionType;
            commission.Amount = (+billMaseterData.SubTotal * +doctorData[0].CommissionValue / 100).toFixed(2);
            commission.Mode = doctorData[0].CommissionMode;
            commission.Value = doctorData[0].CommissionValue;
          }
        } else if (doctorData.length !== 0 && doctorData[0].CommissionType == 2) {
          let [doctorResultB] = await connection.query(`SELECT SUM(billdetail.SubTotal) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND BrandType = 1`);
          let [doctorResultNB] = await connection.query(`SELECT SUM(billdetail.SubTotal) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND BrandType <> 1`);
          commission.Type = doctorData[0].CommissionType;
          if (doctorData[0].CommissionMode == 1) {
            commission.Type = doctorData[0].CommissionType;
            commission.Amount = ((doctorResultB[0].SubTotalVal * +doctorData[0].CommissionValue / 100) + (doctorResultNB[0].SubTotalVal * +doctorData[0].CommissionValueNB / 100)).toFixed(2);
            commission.Mode = doctorData[0].CommissionMode;
            commission.Value = doctorData[0].CommissionValue;
            commission.BrandedCommissionAmount = (doctorResultB[0].SubTotalVal * +doctorData[0].CommissionValue / 100).toFixed(2);
            commission.NonBrandedCommissionAmount = (doctorResultNB[0].SubTotalVal * +doctorData[0].CommissionValueNB / 100).toFixed(2);
          }
        }

        if (commission.Type !== 0 && commission.Amount !== 0) {
          await connection.query(`insert into commissiondetail (CompanyID,ShopID,CommissionMasterID, UserType, UserID,BillMasterID, CommissionMode, CommissionType, CommissionValue, CommissionAmount,BrandedCommissionAmount,NonBrandedCommissionAmount, Status,CreatedBy,CreatedOn ) values (${CompanyID}, ${billMaseterData.ShopID}, 0,'Doctor', ${billMaseterData.Doctor}, ${bMasterID}, ${commission.Mode},${commission.Type},${commission.Value},${commission.Amount},${commission.BrandedCommissionAmount},${commission.NonBrandedCommissionAmount},1,${LoggedOnUser}, now())`);
        }
      }
      return;
    } catch (error) {
      next(error);
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  updateCommission: async (CompanyID, UserType, UserID, bMasterID, billMaseterData, LoggedOnUser) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
      const db = await dbConnection(CompanyID)
      if (db.success === false) {
        return res.status(200).json(db);
      }
      connection = await db.getConnection();
      let commission = { Type: 0, Mode: 0, Value: 0, Amount: 0, BrandedCommissionAmount: 0, NonBrandedCommissionAmount: 0 };
      let commission1 = { Type: 0, Mode: 0, Value: 0, Amount: 0, BrandedCommissionAmount: 0, NonBrandedCommissionAmount: 0 };

      if (UserType === 'Employee') {
        let [userData] = await connection.query(`select * from user where user.ID = ${UserID}`);
        if (userData.length !== 0 && userData[0].CommissionType == 1) {
          commission1.Type = userData[0].CommissionType;
          if (userData[0].CommissionMode == 2) {
            commission1.Amount = userData[0].CommissionValue;
            commission1.Mode = userData[0].CommissionMode;
            commission1.Value = userData[0].CommissionValue;
          } else if (userData[0].CommissionMode == 1) {
            commission1.Type = userData[0].CommissionType;
            commission1.Amount = (+billMaseterData.SubTotal * +userData[0].CommissionValue / 100).toFixed(2);
            commission1.Mode = userData[0].CommissionMode;
            commission1.Value = userData[0].CommissionValue;
          }
        } else if (userData.length !== 0 && userData[0].CommissionType == 2) {
          let [userResultB] = await connection.query(`SELECT ROUND(SUM(billdetail.SubTotal), 2) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND purchasedetailnew.BrandType = 1`);
          let [userResultNB] = await connection.query(`SELECT ROUND(SUM(billdetail.SubTotal), 2) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND purchasedetailnew.BrandType <> 1`);

          commission1.Type = userData[0].CommissionType;
          if (userData[0].CommissionMode == 1) {
            commission1.Type = userData[0].CommissionType;
            commission1.Amount = ((userResultB[0].SubTotalVal * +userData[0].CommissionValue / 100) + (userResultNB[0].SubTotalVal * +userData[0].CommissionValueNB / 100)).toFixed(2);
            commission1.Mode = userData[0].CommissionMode;
            commission1.Value = userData[0].CommissionValue;
            commission1.BrandedCommissionAmount = (userResultB[0].SubTotalVal * +userData[0].CommissionValue / 100).toFixed(2);
            commission1.NonBrandedCommissionAmount = (userResultNB[0].SubTotalVal * +userData[0].CommissionValueNB / 100).toFixed(2);
          }
        }

        if (commission1.Type !== 0 && commission1.Amount !== 0) {
          const [update] = await connection.query(`update commissiondetail set CommissionMode = ${commission1.Mode}, CommissionType = ${commission1.Type}, CommissionValue = ${commission1.Value}, CommissionAmount = ${commission1.Amount}, BrandedCommissionAmount = ${commission1.BrandedCommissionAmount}, NonBrandedCommissionAmount = ${commission1.NonBrandedCommissionAmount}, UpdatedOn = now(), UpdatedBy = '${LoggedOnUser}' where BillmasterID = ${bMasterID} and UserType = 'Employee' and UserID = ${userData[0].ID} and CompanyID = ${CompanyID}`);
        }
      } else if (UserType === 'Doctor') {
        let [doctorData] = await connection.query(`select * from doctor where doctor.ID = ${UserID}`);
        if (doctorData.length !== 0 && doctorData[0].CommissionType == 1) {
          commission.Type = doctorData[0].CommissionType;
          if (doctorData[0].CommissionMode == 2) {
            commission.Amount = doctorData[0].CommissionValue;
            commission.Mode = doctorData[0].CommissionMode;
            commission.Value = doctorData[0].CommissionValue;
          } else if (doctorData[0].CommissionMode == 1) {
            commission.Type = doctorData[0].CommissionType;
            commission.Amount = (+billMaseterData.SubTotal * +doctorData[0].CommissionValue / 100).toFixed(2);
            commission.Mode = doctorData[0].CommissionMode;
            commission.Value = doctorData[0].CommissionValue;
          }
        } else if (doctorData.length !== 0 && doctorData[0].CommissionType == 2) {
          let [doctorResultB] = await connection.query(`SELECT ROUND(SUM(billdetail.SubTotal), 2) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND BrandType = 1`);
          let [doctorResultNB] = await connection.query(`SELECT ROUND(SUM(billdetail.SubTotal), 2) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND BrandType <> 1`);

          commission.Type = doctorData[0].CommissionType;
          if (doctorData[0].CommissionMode == 1) {
            commission.Type = doctorData[0].CommissionType;
            commission.Amount = ((doctorResultB[0].SubTotalVal * +doctorData[0].CommissionValue / 100) + (doctorResultNB[0].SubTotalVal * +doctorData[0].CommissionValueNB / 100)).toFixed(2);
            commission.Mode = doctorData[0].CommissionMode;
            commission.Value = doctorData[0].CommissionValue;
            commission.BrandedCommissionAmount = (doctorResultB[0].SubTotalVal * +doctorData[0].CommissionValue / 100).toFixed(2);
            commission.NonBrandedCommissionAmount = (doctorResultNB[0].SubTotalVal * +doctorData[0].CommissionValueNB / 100).toFixed(2);
          }
        }

        if (commission.Type !== 0 && commission.Amount !== 0) {
          const [update] = await connection.query(`update commissiondetail set CommissionMode = ${commission.Mode}, CommissionType = ${commission.Type}, CommissionValue = ${commission.Value}, CommissionAmount = ${commission.Amount}, BrandedCommissionAmount = ${commission.BrandedCommissionAmount}, NonBrandedCommissionAmount = ${commission.NonBrandedCommissionAmount}, UpdatedOn = now(), UpdatedBy = '${LoggedOnUser}' where BillmasterID = ${bMasterID} and UserType = 'Doctor' and UserID = ${doctorData[0].ID} and CompanyID = ${CompanyID}`);
        }
      }
      return;
    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  generatePreOrderProduct: async (CompanyID, ShopID, Item, LoggedOnUser) => {
    // const db = await dbConfig.dbByCompanyID(CompanyID);
    const db = await dbConnection(CompanyID)
    if (db.success === false) {
      return res.status(200).json(db);
    }
    // delete Item.MeasurementID

    // calcultaion

    Item.DiscountAmount = discountAmount(Item)
    Item.SubTotal = Item.PurchasePrice * 1 - Item.DiscountAmount
    Item.GSTAmount = gstAmount(Item.SubTotal, Item.GSTPercentage)
    Item.TotalAmount = Item.SubTotal + Item.GSTAmount

    const currentStatus = "Pre Order";
    const paymentStatus = "Unpaid"
    const [supplierData] = await connection.query(`select ID, Name, Status from supplier where CompanyID = ${CompanyID} and Name = 'PreOrder Supplier'`)
    console.log(supplierData, '===============supplierData');
    const [purchaseMasterData] = await connection.query(`select ID,InvoiceNo,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount from purchasemasternew where CompanyID = ${CompanyID} and ShopID = ${ShopID} and purchasemasternew.SupplierID = ${supplierData[0].ID} order by purchasemasternew.ID desc`)
    console.log(purchaseMasterData, '===============purchaseMasterData');

    if (purchaseMasterData[0]?.Quantity === undefined || purchaseMasterData[0]?.Quantity <= 50) {
      console.log("Quantity less than 50");
      let updatePurchaseMasterData = []
      let updatePurchaseDetailData = []

      const [purchaseMasterData] = await connection.query(`select ID,InvoiceNo,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount from purchasemasternew where CompanyID = ${CompanyID} and ShopID = ${ShopID} and purchasemasternew.SupplierID = ${supplierData[0].ID} order by purchasemasternew.ID desc`)

      if (!purchaseMasterData.length) {
        // save
        const purchase = {
          ID: null,
          SupplierID: supplierData[0].ID,
          CompanyID: CompanyID,
          ShopID: ShopID,
          PurchaseDate: now(),
          PaymentStatus: paymentStatus,
          InvoiceNo: now(),
          GSTNo: '',
          Status: 1,
          PStatus: 1,
          Quantity: 1,
          SubTotal: Item.SubTotal,
          DiscountAmount: Item.DiscountAmount,
          GSTAmount: Item.GSTAmount,
          TotalAmount: Item.GSTAmount + Item.TotalAmount - Item.DiscountAmount,
          DueAmount: Item.GSTAmount + Item.TotalAmount - Item.DiscountAmount
        }
        updatePurchaseMasterData = purchase
        updatePurchaseDetailData = Item

        //  save purchase data
        const [savePurchase] = await connection.query(`insert into purchasemasternew(SupplierID,CompanyID,ShopID,PurchaseDate,PaymentStatus,InvoiceNo,GSTNo,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount,Status,PStatus,DueAmount,CreatedBy,CreatedOn)values(${purchase.SupplierID},${purchase.CompanyID},${purchase.ShopID},now(),'${paymentStatus}','${purchase.InvoiceNo}','${purchase.GSTNo}',1,${purchase.SubTotal},${purchase.DiscountAmount},${purchase.GSTAmount},${purchase.TotalAmount},1,1,${purchase.TotalAmount}, ${LoggedOnUser}, now())`);

        console.log(connected("Data Save SuccessFUlly !!!"));

        const [savePurchaseDetail] = await connection.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${savePurchase.insertId},${CompanyID},'${Item.ProductName}',${Item.ProductTypeID},'${Item.ProductTypeName}', ${Item.PurchasePrice},1,${Item.SubTotal},${Item.DiscountPercentage},${Item.DiscountAmount},${Item.GSTPercentage},${Item.GSTAmount},'${Item.GSTType}',${Item.TotalAmount},${Item.WholeSale === 1 ? 0 : Item.UnitPrice},${Item.WholeSale !== 1 ? 0 : Item.UnitPrice},${Item.Multiple},${Item.WholeSale},'${Item.BaseBarCode}',${Item.Ledger},1,'${Item.BaseBarCode}',0,${Item.BrandType},'${Item.UniqueBarcode}','${Item.ProductExpDate}',0,0,${LoggedOnUser},now())`)

        console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));

        //  save barcode
        let [detailDataForBarCode] = await connection.query(`select * from purchasedetailnew where Status = 1 and PurchaseID = ${savePurchase.insertId}`)

        if (detailDataForBarCode.length) {
          for (const item of detailDataForBarCode) {
            const barcode = Number(item.BaseBarCode)
            let count = 0;
            count = 1;
            for (j = 0; j < count; j++) {
              const [saveBarcode] = await connection.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn, PreOrder)values(${CompanyID},${ShopID},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}',now(),'${currentStatus}', ${item.WholeSale === 1 ? 0 : item.UnitPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSale !== 1 ? 0 : item.UnitPrice},0,'',0,1,${LoggedOnUser}, now(),1)`)
            }
          }
        }

        console.log(connected("Barcode Data Save SuccessFUlly !!!"));

      } else {
        // update  
        const purchase = {
          ID: purchaseMasterData[0].ID,
          SupplierID: supplierData[0].ID,
          CompanyID: CompanyID,
          ShopID: ShopID,
          PurchaseDate: now(),
          PaymentStatus: paymentStatus,
          InvoiceNo: purchaseMasterData[0].InvoiceNo,
          GSTNo: '',
          Status: 1,
          PStatus: 1,
          Quantity: purchaseMasterData[0].Quantity + 1,
          SubTotal: purchaseMasterData[0].SubTotal + Item.SubTotal,
          DiscountAmount: purchaseMasterData[0].DiscountAmount + Item.DiscountAmount,
          GSTAmount: purchaseMasterData[0].GSTAmount + Item.GSTAmount,
          TotalAmount: Item.GSTAmount + purchaseMasterData[0].TotalAmount + Item.TotalAmount - Item.DiscountAmount,
          DueAmount: Item.GSTAmount + purchaseMasterData[0].TotalAmount + Item.TotalAmount - Item.DiscountAmount
        }

        updatePurchaseMasterData = purchase
        updatePurchaseDetailData = Item

        const [updatePurchaseMaster] = await connection.query(`update purchasemasternew set PaymentStatus='${purchase.PaymentStatus}', Quantity = ${purchase.Quantity}, SubTotal = ${purchase.SubTotal}, DiscountAmount = ${purchase.DiscountAmount}, GSTAmount=${purchase.GSTAmount}, TotalAmount = ${purchase.TotalAmount}, DueAmount = ${purchase.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${purchase.InvoiceNo}' and ShopID = ${ShopID} and ID=${purchase.ID}`)

        console.log(connected("Data Save SuccessFUlly !!!"));


        const [savePurchaseDetail] = await connection.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${purchase.ID},${CompanyID},'${Item.ProductName}',${Item.ProductTypeID},'${Item.ProductTypeName}', ${Item.PurchasePrice},1,${Item.SubTotal},${Item.DiscountPercentage},${Item.DiscountAmount},${Item.GSTPercentage},${Item.GSTAmount},'${Item.GSTType}',${Item.TotalAmount},${Item.WholeSale === 1 ? 0 : Item.UnitPrice},${Item.WholeSale !== 1 ? 0 : Item.UnitPrice},${Item.Multiple},${Item.WholeSale},'${Item.BaseBarCode}',${Item.Ledger},1,'${Item.BaseBarCode}',0,${Item.BrandType},'${Item.UniqueBarcode}','${Item.ProductExpDate}',0,0,${LoggedOnUser},now())`)

        console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));

        let [detailDataForBarCode] = await connection.query(
          `select * from purchasedetailnew where PurchaseID = '${purchase.ID}' ORDER BY ID DESC LIMIT 1`
        );

        if (detailDataForBarCode.length) {
          for (const item of detailDataForBarCode) {
            const barcode = Number(item.BaseBarCode)
            let count = 0;
            count = 1;
            for (j = 0; j < count; j++) {
              const [saveBarcode] = await connection.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn, PreOrder)values(${CompanyID},${ShopID},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}',now(),'${currentStatus}', ${item.WholeSale === 1 ? 0 : item.UnitPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSale !== 1 ? 0 : item.UnitPrice},0,'',0,1,${LoggedOnUser}, now(), 1)`)
            }
          }
        }

        console.log(connected("Barcode Data Save SuccessFUlly !!!"));

      }

    } else if (purchaseMasterData[0]?.Quantity > 50) {
      let updatePurchaseMasterData = []
      let updatePurchaseDetailData = []
      console.log("Quantity greater than 50");
      // length greater than 50
      //  only save hoga
      const purchase = {
        ID: null,
        SupplierID: supplierData[0].ID,
        CompanyID: CompanyID,
        ShopID: ShopID,
        PurchaseDate: now(),
        PaymentStatus: paymentStatus,
        InvoiceNo: now(),
        GSTNo: '',
        Status: 1,
        PStatus: 1,
        Quantity: 1,
        SubTotal: Item.SubTotal,
        DiscountAmount: Item.DiscountAmount,
        GSTAmount: Item.GSTAmount,
        TotalAmount: Item.GSTAmount + Item.TotalAmount - Item.DiscountAmount,
        DueAmount: Item.GSTAmount + Item.TotalAmount - Item.DiscountAmount
      }
      updatePurchaseMasterData = purchase
      updatePurchaseDetailData = Item

      //  save purchase data
      const [savePurchase] = await connection.query(`insert into purchasemasternew(SupplierID,CompanyID,ShopID,PurchaseDate,PaymentStatus,InvoiceNo,GSTNo,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount,Status,PStatus,DueAmount,CreatedBy,CreatedOn)values(${purchase.SupplierID},${purchase.CompanyID},${purchase.ShopID},now(),'${paymentStatus}','${purchase.InvoiceNo}','${purchase.GSTNo}',1,${purchase.SubTotal},${purchase.DiscountAmount},${purchase.GSTAmount},${purchase.TotalAmount},1,1,${purchase.TotalAmount}, ${LoggedOnUser}, now())`);

      console.log(connected("Data Save SuccessFUlly !!!"));

      const [savePurchaseDetail] = await connection.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${savePurchase.insertId},${CompanyID},'${Item.ProductName}',${Item.ProductTypeID},'${Item.ProductTypeName}', ${Item.PurchasePrice},1,${Item.SubTotal},${Item.DiscountPercentage},${Item.DiscountAmount},${Item.GSTPercentage},${Item.GSTAmount},'${Item.GSTType}',${Item.TotalAmount},${Item.WholeSale === 1 ? 0 : Item.UnitPrice},${Item.WholeSale !== 1 ? 0 : Item.UnitPrice},${Item.Multiple},${Item.WholeSale},'${Item.BaseBarCode}',${Item.Ledger},1,'${Item.BaseBarCode}',0,${Item.BrandType},'${Item.UniqueBarcode}','${Item.ProductExpDate}',0,0,${LoggedOnUser},now())`)

      console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));

      //  save barcode
      let [detailDataForBarCode] = await connection.query(`select * from purchasedetailnew where Status = 1 and PurchaseID = ${savePurchase.insertId}`)

      if (detailDataForBarCode.length) {
        for (const item of detailDataForBarCode) {
          const barcode = Number(item.BaseBarCode)
          let count = 0;
          count = 1;
          for (j = 0; j < count; j++) {
            const [saveBarcode] = await connection.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn, PreOrder)values(${CompanyID},${ShopID},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}',now(),'${currentStatus}', ${item.WholeSale === 1 ? 0 : item.UnitPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSale !== 1 ? 0 : item.UnitPrice},0,'',0,1,${LoggedOnUser}, now(),1)`)
          }
        }
      }
      console.log(connected("Barcode Data Save SuccessFUlly !!!"));
    }

    return

  },
  update_c_report_setting: async (CompanyID, ShopID, CurrentDate) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
      const db = await dbConnection(CompanyID)
      if (db.success === false) {
        return res.status(200).json(db);
      }
      connection = await db.getConnection();
      let date = moment(CurrentDate).format("YYYY-MM-DD")
      let back_date = moment(date).subtract(1, 'days').format("YYYY-MM-DD");
      if (!CompanyID) {
        return ({ success: false, message: "Invalid CompanyID Data" })
      }
      if (!ShopID) {
        return ({ success: false, message: "Invalid ShopID Data" })
      }

      // company wise

      const [fetch_company_wise] = await connection.query(`select OpeningStock, AmtOpeningStock  from creport where Date = '${date}' and CompanyID = ${CompanyID} and ShopID = 0`)

      const [fetch_back_date_company_wise] = await connection.query(`select ClosingStock, AmtClosingStock  from creport where Date = '${back_date}' and CompanyID = ${CompanyID} and ShopID = 0`)

      if (fetch_back_date_company_wise[0].ClosingStock !== fetch_company_wise[0].OpeningStock) {
        const [update] = await connection.query(`update creport set OpeningStock = ${fetch_back_date_company_wise[0].ClosingStock} where Date = '${date}' and CompanyID = ${CompanyID} and ShopID = 0`)
      }
      if (fetch_back_date_company_wise[0].AmtClosingStock !== fetch_company_wise[0].AmtOpeningStock) {
        const [update] = await connection.query(`update creport set AmtOpeningStock = ${fetch_back_date_company_wise[0].AmtClosingStock} where Date = '${date}' and CompanyID = ${CompanyID} and ShopID = 0`)
      }

      // shop wise

      const [fetch_shop_wise] = await connection.query(`select OpeningStock, ClosingStock, AmtOpeningStock, AmtClosingStock from creport where Date = '${date}' and CompanyID = ${CompanyID} and ShopID = ${ShopID}`)

      const [fetch_back_date_shop_wise] = await connection.query(`select * from creport where Date = '${back_date}' and CompanyID = ${CompanyID} and ShopID = ${ShopID}`)

      if (fetch_back_date_shop_wise[0].ClosingStock !== fetch_shop_wise[0].OpeningStock) {
        const [update] = await connection.query(`update creport set OpeningStock = ${fetch_shop_wise[0].ClosingStock} where Date = '${date}' and CompanyID = ${CompanyID} and ShopID = ${ShopID}`)
      }
      if (fetch_back_date_shop_wise[0].AmtClosingStock !== fetch_shop_wise[0].AmtOpeningStock) {
        const [update] = await connection.query(`update creport set AmtOpeningStock = ${fetch_shop_wise[0].AmtClosingStock} where Date = '${date}' and CompanyID = ${CompanyID} and ShopID = ${ShopID}`)
      }
      return ({ success: true, message: "update_c_report_setting done" })
    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  getInventory: async (CompanyID, ShopID) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
      const db = await dbConnection(CompanyID)
      if (db.success === false) {
        return res.status(200).json(db);
      }
      connection = await db.getConnection();
      let Qty = 0;
      let shopid = ShopID;
      let params = ``
      if (shopid !== 0) {
        params = ` and barcodemasternew.ShopID IN (${shopid})`
      }
      qry = `SELECT COUNT(barcodemasternew.ID) AS Count, purchasedetailnew.BrandType, purchasedetailnew.ID as PurchaseDetailID , purchasedetailnew.UnitPrice, purchasedetailnew.Quantity, purchasedetailnew.ID, purchasedetailnew.DiscountAmount, purchasedetailnew.TotalAmount, supplier.Name AS SupplierName, shop.Name AS ShopName, shop.AreaName AS AreaName, purchasedetailnew.ProductName, purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice, purchasedetailnew.SubTotal, purchasedetailnew.DiscountPercentage, purchasedetailnew.GSTPercentage as GSTPercentagex, purchasedetailnew.GSTAmount, purchasedetailnew.GSTType as GSTTypex, purchasedetailnew.WholeSalePrice, purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus,  barcodemasternew.*, purchasemasternew.SupplierID FROM barcodemasternew LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID  LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID  LEFT JOIN shop ON shop.ID = barcodemasternew.ShopID  where barcodemasternew.CompanyID = ${CompanyID} AND purchasedetailnew.Status = 1  and barcodemasternew.CurrentStatus = "Available" ${params} Group By barcodemasternew.PurchaseDetailID, barcodemasternew.ShopID HAVING barcodemasternew.Status = 1 `;

      let [data] = await connection.query(qry);

      if (data.length) {
        for (const item of data) {
          Qty += item.Count
        }
      }
      return Qty
    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  getTotalAmountByBarcode: async (CompanyID, Barcode) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
      const db = await dbConnection(CompanyID)
      if (db.success === false) {
        return res.status(200).json(db);
      }
      connection = await db.getConnection();
      console.log("================== getTotalAmountByBarcode ===========");
      console.log(CompanyID, Barcode);
      const [fetchPurchaseDetail] = await connection.query(`select UnitPrice, DiscountPercentage, GSTPercentage from purchasedetailnew where Status = 1 and CompanyID = ${CompanyID} and BaseBarCode = '${Barcode}'`);
      console.log(fetchPurchaseDetail);
      if (!fetchPurchaseDetail.length) {
        return ({ success: false, message: `Purchase detail not found from Barcode no :- ${Barcode}` })
      }

      const itemDetails = {
        UnitPrice: fetchPurchaseDetail[0].UnitPrice,
        Quantity: 1,
        DiscountPercentage: fetchPurchaseDetail[0].DiscountPercentage,
        DiscountAmount: 0,
        GSTPercentage: fetchPurchaseDetail[0].GSTPercentage,
        SubTotal: 0,
        GSTAmount: 0,
        TotalAmount: 0,
      }

      itemDetails.DiscountAmount = discountAmount2(fetchPurchaseDetail[0].UnitPrice, fetchPurchaseDetail[0].DiscountPercentage, 1)
      itemDetails.SubTotal = fetchPurchaseDetail[0].UnitPrice * 1 - itemDetails.DiscountAmount
      itemDetails.GSTAmount = gstAmount(itemDetails.SubTotal, itemDetails.GSTPercentage)
      itemDetails.TotalAmount = itemDetails.SubTotal + itemDetails.GSTAmount

      console.log(" getTotalAmountByBarcode ========> ")
      console.table(itemDetails)
      return itemDetails.TotalAmount

    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  getInventoryAmt: async (CompanyID, ShopID) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
      const db = await dbConnection(CompanyID)
      if (db.success === false) {
        return res.status(200).json(db);
      }
      connection = await db.getConnection();
      const response = {
        data: null, success: true, message: "", calculation: [{
          "totalQty": 0,
          "totalGstAmount": 0,
          "totalAmount": 0,
          "totalDiscount": 0,
          "totalUnitPrice": 0,
          "totalSubTotal": 0,
          "totalRetailPrice": 0,
          "totalWholeSalePrice": 0,
          "gst_details": []
        }]
      }
      let shopid = ShopID;
      let params = ``
      if (shopid !== 0) {
        params = ` and barcodemasternew.ShopID IN (${shopid})`
      }
      qry = `SELECT COUNT(barcodemasternew.ID) AS Count, purchasedetailnew.BrandType, purchasedetailnew.ID as PurchaseDetailID , purchasedetailnew.UnitPrice, purchasedetailnew.Quantity, purchasedetailnew.ID, purchasedetailnew.DiscountAmount, purchasedetailnew.TotalAmount, supplier.Name AS SupplierName, shop.Name AS ShopName, shop.AreaName AS AreaName, purchasedetailnew.ProductName, purchasedetailnew.ProductTypeName, purchasedetailnew.UnitPrice, purchasedetailnew.SubTotal, purchasedetailnew.DiscountPercentage, purchasedetailnew.GSTPercentage as GSTPercentagex, purchasedetailnew.GSTAmount, purchasedetailnew.GSTType as GSTTypex, purchasedetailnew.WholeSalePrice, purchasemasternew.InvoiceNo, purchasemasternew.PurchaseDate, purchasemasternew.PaymentStatus,  barcodemasternew.*, purchasemasternew.SupplierID FROM barcodemasternew LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID  LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID  LEFT JOIN shop ON shop.ID = barcodemasternew.ShopID  where barcodemasternew.CompanyID = ${CompanyID} AND purchasedetailnew.Status = 1  and barcodemasternew.CurrentStatus = "Available" ${params} Group By barcodemasternew.PurchaseDetailID, barcodemasternew.ShopID HAVING barcodemasternew.Status = 1 `;

      let [data] = await connection.query(qry);

      if (data.length) {
        for (const item of data) {
          item.DiscountAmount = item.UnitPrice * item.Count * item.DiscountPercentage / 100
          item.SubTotal = (item.Count * item.UnitPrice) - item.DiscountAmount
          item.GSTAmount = (item.UnitPrice * item.Count - item.DiscountAmount) * item.GSTPercentage / 100
          item.TotalAmount = item.SubTotal + item.GSTAmount

          response.calculation[0].totalQty += item.Count
          response.calculation[0].totalGstAmount += item.GSTAmount
          response.calculation[0].totalAmount += item.TotalAmount
          response.calculation[0].totalDiscount += item.DiscountAmount
          response.calculation[0].totalUnitPrice += item.UnitPrice
          response.calculation[0].totalSubTotal += item.SubTotal
          response.calculation[0].totalRetailPrice += item.Quantity * item.RetailPrice
          response.calculation[0].totalWholeSalePrice += item.Quantity * item.WholeSalePrice
        }
      }
      return response.calculation[0].totalAmount.toFixed(2) || 0
    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  update_c_report: async (CompanyID, ShopID, AddPurchase, AddPreOrderPurchase, DeletePurchase, AddSale, DeleteSale, AddPreOrderSale, DeletePreOrderSale, AddManualSale, DeleteManualSale, OtherDeleteStock, InitiateTransfer, CancelTransfer, AcceptTransfer, CurrentDate) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
      const db = await dbConnection(CompanyID)
      if (db.success === false) {
        return res.status(200).json(db);
      }
      connection = await db.getConnection();
      // let updatesetting = await this.update_c_report_setting(CompanyID, ShopID, CurrentDate)

      let date = moment(CurrentDate).format("YYYY-MM-DD")

      if (!CompanyID) {
        return ({ success: false, message: "Invalid CompanyID Data" })
      }
      if (!ShopID) {
        return ({ success: false, message: "Invalid ShopID Data" })
      }

      // company wise

      const [fetch_company_wise] = await connection.query(`select * from creport where Date = '${date}' and CompanyID = ${CompanyID} and ShopID = 0`)

      let company_wise = {
        openingstock: parseInt(fetch_company_wise[0].OpeningStock),
        addpurchase: parseFloat(fetch_company_wise[0].AddPurchase) + parseFloat(AddPurchase),
        addpreorderpurchase: parseFloat(fetch_company_wise[0].AddPreOrderPurchase) + parseFloat(AddPreOrderPurchase),
        deletepurchase: parseFloat(fetch_company_wise[0].DeletePurchase) + parseFloat(DeletePurchase),
        addsale: parseFloat(fetch_company_wise[0].AddSale) + parseFloat(AddSale),
        deletesale: parseFloat(fetch_company_wise[0].DeleteSale) + parseFloat(DeleteSale),
        addpreordersale: parseFloat(fetch_company_wise[0].AddPreOrderSale) + parseFloat(AddPreOrderSale),
        deletepreordersale: parseFloat(fetch_company_wise[0].DeletePreOrderSale) + parseFloat(DeletePreOrderSale),
        addmanualsale: parseFloat(fetch_company_wise[0].AddManualSale) + parseFloat(AddManualSale),
        deletemanualsale: parseFloat(fetch_company_wise[0].DeleteManualSale) + parseFloat(DeleteManualSale),
        otherdeletestock: parseFloat(fetch_company_wise[0].OtherDeleteStock) + parseFloat(OtherDeleteStock),
        initiatetransfer: parseFloat(fetch_company_wise[0].InitiateTransfer) + parseFloat(InitiateTransfer),
        cancelTransfer: parseFloat(fetch_company_wise[0].CancelTransfer) + parseFloat(CancelTransfer),
        accepttransfer: parseFloat(fetch_company_wise[0].AcceptTransfer) + parseFloat(AcceptTransfer),
        closingstock: 0
      };

      company_wise.closingstock = company_wise.openingstock + company_wise.addpurchase + company_wise.addpreorderpurchase - company_wise.deletepurchase - company_wise.addsale + company_wise.deletesale - company_wise.addpreordersale + company_wise.deletepreordersale + company_wise.accepttransfer - company_wise.initiatetransfer + company_wise.cancelTransfer - company_wise.otherdeletestock;

      const [update_company_wise] = await connection.query(`update creport set AddPurchase=${company_wise.addpurchase}, AddPreOrderPurchase=${company_wise.addpreorderpurchase}, DeletePurchase=${company_wise.deletepurchase}, AddSale=${company_wise.addsale}, DeleteSale=${company_wise.deletesale}, AddPreOrderSale=${company_wise.addpreordersale}, DeletePreOrderSale=${company_wise.deletepreordersale}, AddManualSale=${company_wise.addmanualsale}, DeleteManualSale=${company_wise.deletemanualsale}, OtherDeleteStock=${company_wise.otherdeletestock}, InitiateTransfer=${company_wise.initiatetransfer}, CancelTransfer=${company_wise.cancelTransfer}, AcceptTransfer=${company_wise.accepttransfer}, ClosingStock=${company_wise.closingstock} where ID = ${fetch_company_wise[0].ID}`)

      console.log("===== company wise =====", date);
      console.table(company_wise);

      // shop wise

      const [fetch_shop_wise] = await connection.query(`select * from creport where Date = '${date}' and CompanyID = ${CompanyID} and ShopID = ${ShopID}`)

      let shop_wise = {
        openingstock: parseInt(fetch_shop_wise[0].OpeningStock),
        addpurchase: parseFloat(fetch_shop_wise[0].AddPurchase) + parseFloat(AddPurchase),
        addpreorderpurchase: parseFloat(fetch_shop_wise[0].AddPreOrderPurchase) + parseFloat(AddPreOrderPurchase),
        deletepurchase: parseFloat(fetch_shop_wise[0].DeletePurchase) + parseFloat(DeletePurchase),
        addsale: parseFloat(fetch_shop_wise[0].AddSale) + parseFloat(AddSale),
        deletesale: parseFloat(fetch_shop_wise[0].DeleteSale) + parseFloat(DeleteSale),
        addpreordersale: parseFloat(fetch_shop_wise[0].AddPreOrderSale) + parseFloat(AddPreOrderSale),
        deletepreordersale: parseFloat(fetch_shop_wise[0].DeletePreOrderSale) + parseFloat(DeletePreOrderSale),
        addmanualsale: parseFloat(fetch_shop_wise[0].AddManualSale) + parseFloat(AddManualSale),
        deletemanualsale: parseFloat(fetch_shop_wise[0].DeleteManualSale) + parseFloat(DeleteManualSale),
        otherdeletestock: parseFloat(fetch_shop_wise[0].OtherDeleteStock) + parseFloat(OtherDeleteStock),
        initiatetransfer: parseFloat(fetch_shop_wise[0].InitiateTransfer) + parseFloat(InitiateTransfer),
        cancelTransfer: parseFloat(fetch_shop_wise[0].CancelTransfer) + parseFloat(CancelTransfer),
        accepttransfer: parseFloat(fetch_shop_wise[0].AcceptTransfer) + parseFloat(AcceptTransfer),
        closingstock: 0
      };


      shop_wise.closingstock = shop_wise.openingstock + shop_wise.addpurchase + shop_wise.addpreorderpurchase - shop_wise.deletepurchase - shop_wise.addsale + shop_wise.deletesale - shop_wise.addpreordersale + shop_wise.deletepreordersale + shop_wise.accepttransfer - shop_wise.initiatetransfer + shop_wise.cancelTransfer - shop_wise.otherdeletestock;

      const [update_shop_wise] = await connection.query(`update creport set AddPurchase=${shop_wise.addpurchase}, AddPreOrderPurchase=${shop_wise.addpreorderpurchase}, DeletePurchase=${shop_wise.deletepurchase}, AddSale=${shop_wise.addsale}, DeleteSale=${shop_wise.deletesale}, AddPreOrderSale=${shop_wise.addpreordersale}, DeletePreOrderSale=${shop_wise.deletepreordersale}, AddManualSale=${shop_wise.addmanualsale}, DeleteManualSale=${shop_wise.deletemanualsale}, OtherDeleteStock=${shop_wise.otherdeletestock}, InitiateTransfer=${shop_wise.initiatetransfer}, CancelTransfer=${shop_wise.cancelTransfer}, AcceptTransfer=${shop_wise.accepttransfer},ClosingStock=${shop_wise.closingstock} where ID = ${fetch_shop_wise[0].ID}`)

      console.log("===== shop wise =====", date);
      console.table(shop_wise);

    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  amt_update_c_report: async (CompanyID, ShopID, AddPurchase, AddPreOrderPurchase, DeletePurchase, AddSale, DeleteSale, AddPreOrderSale, DeletePreOrderSale, AddManualSale, DeleteManualSale, OtherDeleteStock, InitiateTransfer, CancelTransfer, AcceptTransfer, CurrentDate) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
      const db = await dbConnection(CompanyID)
      if (db.success === false) {
        return res.status(200).json(db);
      }
      connection = await db.getConnection();
      // let updatesetting = await this.update_c_report_setting(CompanyID, ShopID, CurrentDate)

      let date = moment(CurrentDate).format("YYYY-MM-DD")

      if (!CompanyID) {
        return ({ success: false, message: "Invalid CompanyID Data" })
      }
      if (!ShopID) {
        return ({ success: false, message: "Invalid ShopID Data" })
      }

      // company wise

      const [fetch_company_wise] = await connection.query(`select * from creport where Date = '${date}' and CompanyID = ${CompanyID} and ShopID = 0`)

      let company_wise = {
        openingstock: parseInt(fetch_company_wise[0].AmtOpeningStock),
        addpurchase: parseFloat(fetch_company_wise[0].AmtAddPurchase) + parseFloat(AddPurchase),
        addpreorderpurchase: parseFloat(fetch_company_wise[0].AmtAddPreOrderPurchase) + parseFloat(AddPreOrderPurchase),
        deletepurchase: parseFloat(fetch_company_wise[0].AmtDeletePurchase) + parseFloat(DeletePurchase),
        addsale: parseFloat(fetch_company_wise[0].AmtAddSale) + parseFloat(AddSale),
        deletesale: parseFloat(fetch_company_wise[0].AmtDeleteSale) + parseFloat(DeleteSale),
        addpreordersale: parseFloat(fetch_company_wise[0].AmtAddPreOrderSale) + parseFloat(AddPreOrderSale),
        deletepreordersale: parseFloat(fetch_company_wise[0].AmtDeletePreOrderSale) + parseFloat(DeletePreOrderSale),
        addmanualsale: parseFloat(fetch_company_wise[0].AmtAddManualSale) + parseFloat(AddManualSale),
        deletemanualsale: parseFloat(fetch_company_wise[0].AmtDeleteManualSale) + parseFloat(DeleteManualSale),
        otherdeletestock: parseFloat(fetch_company_wise[0].AmtOtherDeleteStock) + parseFloat(OtherDeleteStock),
        initiatetransfer: parseFloat(fetch_company_wise[0].AmtInitiateTransfer) + parseFloat(InitiateTransfer),
        cancelTransfer: parseFloat(fetch_company_wise[0].AmtCancelTransfer) + parseFloat(CancelTransfer),
        accepttransfer: parseFloat(fetch_company_wise[0].AmtAcceptTransfer) + parseFloat(AcceptTransfer),
        closingstock: 0
      };

      company_wise.closingstock = company_wise.openingstock + company_wise.addpurchase + company_wise.addpreorderpurchase - company_wise.deletepurchase - company_wise.addsale + company_wise.deletesale - company_wise.addpreordersale + company_wise.deletepreordersale + company_wise.accepttransfer - company_wise.initiatetransfer + company_wise.cancelTransfer - company_wise.otherdeletestock;

      const [update_company_wise] = await connection.query(`update creport set AmtAddPurchase=${company_wise.addpurchase}, AmtAddPreOrderPurchase=${company_wise.addpreorderpurchase}, AmtDeletePurchase=${company_wise.deletepurchase}, AmtAddSale=${company_wise.addsale}, AmtDeleteSale=${company_wise.deletesale}, AmtAddPreOrderSale=${company_wise.addpreordersale}, AmtDeletePreOrderSale=${company_wise.deletepreordersale}, AmtAddManualSale=${company_wise.addmanualsale}, AmtDeleteManualSale=${company_wise.deletemanualsale}, AmtOtherDeleteStock=${company_wise.otherdeletestock}, AmtInitiateTransfer=${company_wise.initiatetransfer}, AmtCancelTransfer=${company_wise.cancelTransfer}, AmtAcceptTransfer=${company_wise.accepttransfer}, AmtClosingStock=${company_wise.closingstock} where ID = ${fetch_company_wise[0].ID}`)

      console.log("===== company wise Amount Report =====", date);
      console.table(company_wise);

      // shop wise

      const [fetch_shop_wise] = await connection.query(`select * from creport where Date = '${date}' and CompanyID = ${CompanyID} and ShopID = ${ShopID}`)

      let shop_wise = {
        openingstock: parseInt(fetch_shop_wise[0].AmtOpeningStock),
        addpurchase: parseFloat(fetch_shop_wise[0].AmtAddPurchase) + parseFloat(AddPurchase),
        addpreorderpurchase: parseFloat(fetch_shop_wise[0].AmtAddPreOrderPurchase) + parseFloat(AddPreOrderPurchase),
        deletepurchase: parseFloat(fetch_shop_wise[0].AmtDeletePurchase) + parseFloat(DeletePurchase),
        addsale: parseFloat(fetch_shop_wise[0].AmtAddSale) + parseFloat(AddSale),
        deletesale: parseFloat(fetch_shop_wise[0].AmtDeleteSale) + parseFloat(DeleteSale),
        addpreordersale: parseFloat(fetch_shop_wise[0].AmtAddPreOrderSale) + parseFloat(AddPreOrderSale),
        deletepreordersale: parseFloat(fetch_shop_wise[0].AmtDeletePreOrderSale) + parseFloat(DeletePreOrderSale),
        addmanualsale: parseFloat(fetch_shop_wise[0].AmtAddManualSale) + parseFloat(AddManualSale),
        deletemanualsale: parseFloat(fetch_shop_wise[0].AmtDeleteManualSale) + parseFloat(DeleteManualSale),
        otherdeletestock: parseFloat(fetch_shop_wise[0].AmtOtherDeleteStock) + parseFloat(OtherDeleteStock),
        initiatetransfer: parseFloat(fetch_shop_wise[0].AmtInitiateTransfer) + parseFloat(InitiateTransfer),
        cancelTransfer: parseFloat(fetch_shop_wise[0].AmtCancelTransfer) + parseFloat(CancelTransfer),
        accepttransfer: parseFloat(fetch_shop_wise[0].AmtAcceptTransfer) + parseFloat(AcceptTransfer),
        closingstock: 0
      };


      shop_wise.closingstock = shop_wise.openingstock + shop_wise.addpurchase + shop_wise.addpreorderpurchase - shop_wise.deletepurchase - shop_wise.addsale + shop_wise.deletesale - shop_wise.addpreordersale + shop_wise.deletepreordersale + shop_wise.accepttransfer - shop_wise.initiatetransfer + shop_wise.cancelTransfer - shop_wise.otherdeletestock;

      const [update_shop_wise] = await connection.query(`update creport set AmtAddPurchase=${shop_wise.addpurchase}, AmtAddPreOrderPurchase=${shop_wise.addpreorderpurchase}, AmtDeletePurchase=${shop_wise.deletepurchase}, AmtAddSale=${shop_wise.addsale}, AmtDeleteSale=${shop_wise.deletesale}, AmtAddPreOrderSale=${shop_wise.addpreordersale}, AmtDeletePreOrderSale=${shop_wise.deletepreordersale}, AmtAddManualSale=${shop_wise.addmanualsale}, AmtDeleteManualSale=${shop_wise.deletemanualsale}, AmtOtherDeleteStock=${shop_wise.otherdeletestock}, AmtInitiateTransfer=${shop_wise.initiatetransfer}, AmtCancelTransfer=${shop_wise.cancelTransfer}, AmtAcceptTransfer=${shop_wise.accepttransfer},AmtClosingStock=${shop_wise.closingstock} where ID = ${fetch_shop_wise[0].ID}`)

      console.log("===== shop wise Amount Report =====", date);
      console.table(shop_wise);

    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  update_pettycash_report: async (CompanyID, ShopID, Type, Amount, RegisterType, CurrentDate) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
      const db = await dbConnection(CompanyID)
      if (db.success === false) {
        return res.status(200).json(db);
      }
      connection = await db.getConnection();
      console.table({ CompanyID, ShopID, Type, Amount, RegisterType, CurrentDate });

      let date = moment(CurrentDate).format("YYYY-MM-DD")

      if (!CompanyID) {
        return ({ success: false, message: "Invalid CompanyID Data" })
      }
      if (!ShopID) {
        return ({ success: false, message: "Invalid ShopID Data" })
      }

      let datum = {
        date: date,
        OpeningBalance: 0,
        CompanyID,
        ShopID,
        RegisterType,
        Sale: 0,
        Expense: 0,
        Doctor: 0,
        Employee: 0,
        Payroll: 0,
        Fitter: 0,
        Supplier: 0,
        Deposit: 0,
        Withdrawal: 0,
        ClosingBalance: 0
      }


      const [fetch] = await connection.query(`select * from pettycashreport where  CompanyID = ${CompanyID} and ShopID = ${ShopID} and RegisterType = '${RegisterType}' `)

      if (!fetch.length) {
        if (RegisterType === "PettyCash") {

          const [DepositBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${ShopID} and CashType='PettyCash' and CreditType='Deposit'`)

          const [WithdrawalBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${ShopID} and CashType='PettyCash' and CreditType='Withdrawal'`)

          let Balance = DepositBalance[0]?.Amount - WithdrawalBalance[0]?.Amount || 0

          if (Type === "Sale" || Type === "Deposit") {
            Balance = Balance - Amount
          } else {
            Balance = Balance + Amount
          }

          let back_date = moment(date).subtract(1, 'days').format("YYYY-MM-DD");

          const [save] = await connection.query(`INSERT into pettycashreport(CompanyID,ShopID,RegisterType, Date, OpeningBalance,Sale,Expense,Doctor, Employee, Payroll, Fitter, Supplier,Withdrawal, Deposit, ClosingBalance)values(${datum.CompanyID}, ${datum.ShopID}, '${datum.RegisterType}','${back_date}',${datum.OpeningBalance}, ${datum.Sale}, ${datum.Expense}, ${datum.Doctor}, ${datum.Employee}, ${datum.Payroll}, ${datum.Fitter}, ${datum.Supplier}, ${datum.Withdrawal}, ${datum.Deposit}, ${Balance})`)

        }
        if (RegisterType === "CashCounter") {

          const [DepositBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${ShopID} and CashType='CashCounter' and CreditType='Deposit'`)

          const [WithdrawalBalance] = await connection.query(`select SUM(pettycash.Amount) as Amount from pettycash where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${ShopID} and CashType='CashCounter' and CreditType='Withdrawal'`)

          let Balance = DepositBalance[0]?.Amount - WithdrawalBalance[0]?.Amount || 0
          if (Type === "Sale" || Type === "Deposit") {
            Balance = Balance - Amount
          } else {
            Balance = Balance + Amount
          }
          let back_date = moment(date).subtract(1, 'days').format("YYYY-MM-DD");

          const [save] = await connection.query(`INSERT into pettycashreport(CompanyID,ShopID,RegisterType, Date, OpeningBalance,Sale,Expense,Doctor, Employee, Payroll, Fitter, Supplier,Withdrawal, Deposit, ClosingBalance)values(${datum.CompanyID}, ${datum.ShopID}, '${datum.RegisterType}','${back_date}',${datum.OpeningBalance}, ${datum.Sale}, ${datum.Expense}, ${datum.Doctor}, ${datum.Employee}, ${datum.Payroll}, ${datum.Fitter}, ${datum.Supplier}, ${datum.Withdrawal}, ${datum.Deposit}, ${Balance})`)
        }
      }

      const [fetchPettyCash] = await connection.query(`select * from pettycashreport where Date = '${date}' and CompanyID = ${CompanyID} and ShopID = ${ShopID} and RegisterType = '${RegisterType}' `)

      if (!fetchPettyCash.length) {

        const [fetchPettyCashBackDate] = await connection.query(`select * from pettycashreport where CompanyID = ${CompanyID} and ShopID = ${ShopID} and RegisterType = '${RegisterType}' Order By ID desc`)


        if (fetchPettyCashBackDate.length) {
          datum.OpeningBalance = Number(fetchPettyCashBackDate[0].ClosingBalance)
        }

      }


      if (fetchPettyCash.length) {
        // update
        datum.OpeningBalance = Number(fetchPettyCash[0].ClosingBalance)
        datum.Sale = Number(fetchPettyCash[0].Sale)
        datum.Expense = Number(fetchPettyCash[0].Expense)
        datum.Doctor = Number(fetchPettyCash[0].Doctor)
        datum.Employee = Number(fetchPettyCash[0].Employee)
        datum.Payroll = Number(fetchPettyCash[0].Payroll)
        datum.Fitter = Number(fetchPettyCash[0].Fitter)
        datum.Supplier = Number(fetchPettyCash[0].Supplier)
        datum.Deposit = Number(fetchPettyCash[0].Deposit)
        datum.Withdrawal = Number(fetchPettyCash[0].Withdrawal)
        if (Type === "Sale") {
          datum.ClosingBalance = Number(fetchPettyCash[0].ClosingBalance) + Amount;
          datum.Sale = Number(fetchPettyCash[0].Sale) + Amount
        }
        if (Type === "Deposit") {
          datum.ClosingBalance = Number(fetchPettyCash[0].ClosingBalance) + Amount;
          datum.Deposit = Number(fetchPettyCash[0].Deposit) + Amount
        }
        if (Type === "Expense") {
          datum.ClosingBalance = Number(fetchPettyCash[0].ClosingBalance) - Amount;
          datum.Expense = Number(fetchPettyCash[0].Expense) + Amount
        }
        if (Type === "Doctor") {
          datum.ClosingBalance = Number(fetchPettyCash[0].ClosingBalance) - Amount;
          datum.Doctor = Number(fetchPettyCash[0].Doctor) + Amount
        }
        if (Type === "Employee") {
          datum.ClosingBalance = Number(fetchPettyCash[0].ClosingBalance) - Amount;
          datum.Employee = Number(fetchPettyCash[0].Employee) + Amount
        }
        if (Type === "Payroll") {
          datum.ClosingBalance = Number(fetchPettyCash[0].ClosingBalance) - Amount;
          datum.Payroll = Number(fetchPettyCash[0].Payroll) + Amount
        }
        if (Type === "Fitter") {
          datum.ClosingBalance = Number(fetchPettyCash[0].ClosingBalance) - Amount;
          datum.Fitter = Number(fetchPettyCash[0].Fitter) + Amount
        }
        if (Type === "Supplier") {
          datum.ClosingBalance = Number(fetchPettyCash[0].ClosingBalance) - Amount;
          datum.Supplier = Number(fetchPettyCash[0].Supplier) + Amount
        }
        if (Type === "Withdrawal") {
          datum.ClosingBalance = Number(fetchPettyCash[0].ClosingBalance) - Amount;
          datum.Withdrawal = Number(fetchPettyCash[0].Withdrawal) + Amount
        }

        const [update] = await connection.query(`update pettycashreport set Sale = ${datum.Sale}, Expense = ${datum.Expense}, Doctor = ${datum.Doctor}, Employee = ${datum.Employee} , Payroll = ${datum.Payroll}, Fitter = ${datum.Fitter}, Supplier = ${datum.Supplier}, Withdrawal = ${datum.Withdrawal}, Deposit = ${datum.Deposit}, ClosingBalance = ${datum.ClosingBalance} where ID = ${fetchPettyCash[0].ID}`)

        console.table(datum)

      }

      if (!fetchPettyCash.length) {
        // insert
        datum.ClosingBalance = datum.OpeningBalance
        if (Type === "Sale") {
          datum.ClosingBalance = datum.ClosingBalance + Amount;
          datum.Sale = Amount
        }
        if (Type === "Deposit") {
          datum.ClosingBalance = datum.ClosingBalance + Amount;
          datum.Deposit = Amount
        }
        if (Type === "Expense") {
          datum.ClosingBalance = datum.ClosingBalance - Amount;
          datum.Expense = Amount
        }
        if (Type === "Doctor") {
          datum.ClosingBalance = datum.ClosingBalance - Amount;
          datum.Doctor = Amount
        }
        if (Type === "Employee") {
          datum.ClosingBalance = datum.ClosingBalance - Amount;
          datum.Employee = Amount
        }
        if (Type === "Payroll") {
          datum.ClosingBalance = datum.ClosingBalance - Amount;
          datum.Payroll = Amount
        }
        if (Type === "Fitter") {
          datum.ClosingBalance = datum.ClosingBalance - Amount;
          datum.Fitter = Amount
        }
        if (Type === "Supplier") {
          datum.ClosingBalance = datum.ClosingBalance - Amount;
          datum.Supplier = Amount
        }
        if (Type === "Withdrawal") {
          datum.ClosingBalance = datum.ClosingBalance - Amount;
          datum.Withdrawal = Amount
        }

        const [save] = await connection.query(`INSERT into pettycashreport(CompanyID,ShopID,RegisterType, Date, OpeningBalance,Sale,Expense,Doctor, Employee, Payroll, Fitter, Supplier,Withdrawal, Deposit, ClosingBalance)values(${datum.CompanyID}, ${datum.ShopID}, '${datum.RegisterType}','${date}',${datum.OpeningBalance}, ${datum.Sale}, ${datum.Expense}, ${datum.Doctor}, ${datum.Employee}, ${datum.Payroll}, ${datum.Fitter}, ${datum.Supplier}, ${datum.Withdrawal}, ${datum.Deposit}, ${datum.ClosingBalance})`)


        console.table(datum)


      }

    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }

  },
  update_pettycash_counter_report: async (CompanyID, ShopID, Type, Amount, CurrentDate) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
      const db = await dbConnection(CompanyID)
      if (db.success === false) {
        return res.status(200).json(db);
      }
      connection = await db.getConnection();
      console.table({ CompanyID, ShopID, Type, Amount, CurrentDate });

      let date = moment(CurrentDate).format("YYYY-MM-DD");

      if (!CompanyID) {
        return { success: false, message: "Invalid CompanyID Data" };
      }
      if (!ShopID) {
        return { success: false, message: "Invalid ShopID Data" };
      }

      // Define a function to process each RegisterType
      const processRegisterType = async (RegisterType) => {
        let datum = {
          date: date,
          OpeningBalance: 0,
          CompanyID,
          ShopID,
          RegisterType,
          Sale: 0,
          Expense: 0,
          Doctor: 0,
          Employee: 0,
          Payroll: 0,
          Fitter: 0,
          Supplier: 0,
          Deposit: 0,
          Withdrawal: 0,
          ClosingBalance: 0,
        };

        // Fetch existing data for the given RegisterType
        const [fetch] = await connection.query(
          `SELECT * FROM pettycashreport WHERE CompanyID = ${CompanyID} AND ShopID = ${ShopID} AND RegisterType = '${RegisterType}' AND Date = '${date}'`
        );

        // Calculate current Deposit and Withdrawal totals
        const [DepositBalance] = await connection.query(
          `SELECT SUM(pettycash.Amount) as Amount FROM pettycash WHERE Status = 1 AND CompanyID = ${CompanyID} AND ShopID = ${ShopID} AND CashType='${RegisterType}' AND CreditType='Deposit'`
        );

        const [WithdrawalBalance] = await connection.query(
          `SELECT SUM(pettycash.Amount) as Amount FROM pettycash WHERE Status = 1 AND CompanyID = ${CompanyID} AND ShopID = ${ShopID} AND CashType='${RegisterType}' AND CreditType='Withdrawal'`
        );

        // Calculate initial Balance
        let Balance = DepositBalance[0]?.Amount - WithdrawalBalance[0]?.Amount || 0;

        // Adjust balance based on transaction Type
        if (Type === "Sale" || Type === "Deposit") {
          Balance -= Amount;
        } else if (Type === "Withdrawal") {
          Balance += Amount;
        }

        // Set back date for initial records
        let back_date = moment(date).subtract(1, "days").format("YYYY-MM-DD");

        if (!fetch.length) {
          // If no record exists, insert a new record with initial values
          await connection.query(
            `INSERT INTO pettycashreport(CompanyID, ShopID, RegisterType, Date, OpeningBalance, Sale, Expense, Doctor, Employee, Payroll, Fitter, Supplier, Withdrawal, Deposit, ClosingBalance) 
            VALUES(${datum.CompanyID}, ${datum.ShopID}, '${datum.RegisterType}', '${back_date}', ${datum.OpeningBalance}, ${datum.Sale}, ${datum.Expense}, ${datum.Doctor}, ${datum.Employee}, ${datum.Payroll}, ${datum.Fitter}, ${datum.Supplier}, ${datum.Withdrawal}, ${datum.Deposit}, ${Balance})`
          );
        }

        const [fetchPettyCash] = await connection.query(
          `SELECT * FROM pettycashreport WHERE Date = '${date}' AND CompanyID = ${CompanyID} AND ShopID = ${ShopID} AND RegisterType = '${RegisterType}'`
        );

        if (fetchPettyCash.length) {
          datum.OpeningBalance = Number(fetchPettyCash[0].ClosingBalance);
          datum.Sale = Number(fetchPettyCash[0].Sale);
          datum.Expense = Number(fetchPettyCash[0].Expense);
          datum.Doctor = Number(fetchPettyCash[0].Doctor);
          datum.Employee = Number(fetchPettyCash[0].Employee);
          datum.Payroll = Number(fetchPettyCash[0].Payroll);
          datum.Fitter = Number(fetchPettyCash[0].Fitter);
          datum.Supplier = Number(fetchPettyCash[0].Supplier);
          datum.Deposit = DepositBalance[0]?.Amount || 0;
          datum.Withdrawal = WithdrawalBalance[0]?.Amount || 0;

          if (Type === "Deposit") {
            datum.Deposit += Amount;
            datum.ClosingBalance = datum.OpeningBalance + datum.Deposit - datum.Withdrawal;
          } else if (Type === "Withdrawal") {
            datum.Withdrawal += Amount;
            datum.ClosingBalance = datum.OpeningBalance + datum.Deposit - datum.Withdrawal;
          } else {
            datum.ClosingBalance = datum.OpeningBalance;
          }

          // Update existing record
          await connection.query(
            `UPDATE pettycashreport SET Sale = ${datum.Sale}, Expense = ${datum.Expense}, Doctor = ${datum.Doctor}, Employee = ${datum.Employee}, Payroll = ${datum.Payroll}, Fitter = ${datum.Fitter}, Supplier = ${datum.Supplier}, Withdrawal = ${datum.Withdrawal}, Deposit = ${datum.Deposit}, ClosingBalance = ${datum.ClosingBalance} WHERE ID = ${fetchPettyCash[0].ID}`
          );

          console.table(datum);
        } else {

          const [fetchPettyCashBackDate] = await connection.query(`select * from pettycashreport where CompanyID = ${CompanyID} and ShopID = ${ShopID} and RegisterType = '${RegisterType}' Order By ID desc`)

          if (fetchPettyCashBackDate.length) {
            datum.OpeningBalance = Number(fetchPettyCashBackDate[0].ClosingBalance)
          }

          datum.ClosingBalance = datum.OpeningBalance;
          if (Type === "Deposit") {
            datum.Deposit = Amount;
            datum.ClosingBalance += datum.Deposit;
          } else if (Type === "Withdrawal") {
            datum.Withdrawal = Amount;
            datum.ClosingBalance -= datum.Withdrawal;
          }

          // Insert new record
          await connection.query(
            `INSERT INTO pettycashreport(CompanyID, ShopID, RegisterType, Date, OpeningBalance, Sale, Expense, Doctor, Employee, Payroll, Fitter, Supplier, Withdrawal, Deposit, ClosingBalance) 
            VALUES(${datum.CompanyID}, ${datum.ShopID}, '${datum.RegisterType}', '${date}', ${datum.OpeningBalance}, ${datum.Sale}, ${datum.Expense}, ${datum.Doctor}, ${datum.Employee}, ${datum.Payroll}, ${datum.Fitter}, ${datum.Supplier}, ${datum.Withdrawal}, ${datum.Deposit}, ${datum.ClosingBalance})`
          );

          console.table(datum);
        }
      };

      // Process both PettyCash and CashCounter
      await processRegisterType('PettyCash');
      await processRegisterType('CashCounter');

    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  reward_master: async (CompanyID, ShopID, CustomerID, InvoiceNo, PaidAmount, CreditType, LoggedOnUser) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
      const db = await dbConnection(CompanyID)
      if (db.success === false) {
        return res.status(200).json(db);
      }
      connection = await db.getConnection();
      if (!CompanyID) {
        return { success: false, message: "Invalid CompanyID Data" };
      }
      if (!ShopID) {
        return { success: false, message: "Invalid ShopID Data" };
      }
      console.table({ CompanyID, ShopID, CustomerID, InvoiceNo, PaidAmount, CreditType });
      const [fetchCompany] = await connection.query(`select companysetting.ID, companysetting.RewardExpiryDate,companysetting.RewardPercentage,companysetting.AppliedReward from companysetting where Status = 1 and ID = ${CompanyID}`);

      if (!fetchCompany.length) {
        return { success: false, message: "Invalid CompanyID Data" };
      }

      if (CreditType === 'credit') {

        const datum = {
          CompanyID, ShopID, CustomerID, InvoiceNo, PaidAmount, CreditType,
          RewardPercentage: fetchCompany[0].RewardPercentage,
          Amount: calculateAmount(PaidAmount, fetchCompany[0].RewardPercentage)
        }

        if (datum.Amount > 0) {
          console.log("reward_master datum ====> ", datum);
          const saveData = await connection.query(`insert into rewardmaster(CompanyID, ShopID, CustomerID, InvoiceNo, PaidAmount,RewardPercentage,Amount, CreditType, Status, CreatedBy, CreatedOn) values(${CompanyID}, ${ShopID}, ${CustomerID}, '${InvoiceNo}', ${PaidAmount},${datum.RewardPercentage},${datum.Amount}, '${CreditType}', 1, ${LoggedOnUser}, now())`);
        }

      }
      if (CreditType === 'debit') {

        const datum = {
          CompanyID, ShopID, CustomerID, InvoiceNo, PaidAmount, CreditType,
          RewardPercentage: fetchCompany[0].AppliedReward,
          Amount: PaidAmount
        }

        if (datum.Amount > 0) {
          console.log("reward_master datum ====> ", datum);
          const saveData = await connection.query(`insert into rewardmaster(CompanyID, ShopID, CustomerID, InvoiceNo, PaidAmount,RewardPercentage,Amount, CreditType, Status, CreatedBy, CreatedOn) values(${CompanyID}, ${ShopID}, ${CustomerID}, '${InvoiceNo}', ${PaidAmount},${datum.RewardPercentage},${datum.Amount}, '${CreditType}', 1, ${LoggedOnUser}, now())`);
        }

      }
      if (CreditType === 'customer_return_debit') {

        const datum = {
          CompanyID, ShopID, CustomerID, InvoiceNo, PaidAmount, CreditType,
          RewardPercentage: fetchCompany[0].RewardPercentage,
          Amount: calculateAmount(PaidAmount, fetchCompany[0].RewardPercentage)
        }

        if (datum.Amount > 0) {
          console.log("reward_master datum ====> ", datum);
          const saveData = await connection.query(`insert into rewardmaster(CompanyID, ShopID, CustomerID, InvoiceNo, PaidAmount,RewardPercentage,Amount, CreditType, Status, CreatedBy, CreatedOn) values(${CompanyID}, ${ShopID}, ${CustomerID}, '${InvoiceNo}', ${PaidAmount},${datum.RewardPercentage},${datum.Amount}, 'debit', 1, ${LoggedOnUser}, now())`);
        }

      }




      return { success: true, message: "data update" };

    } catch (error) {
      console.log("reward_master", error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  getCustomerRewardBalance: async (CustomerID, CompanyID) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
      const db = await dbConnection(CompanyID)
      if (db.success === false) {
        return res.status(200).json(db);
      }
      connection = await db.getConnection();
     // console.table({ CustomerID, CompanyID });

      if (!CompanyID) {
        return { success: false, message: "Invalid CompanyID Data" };
      }
      if (!CustomerID) {
        return { success: false, message: "Invalid CustomerID Data" };
      }

      const [CreditBalance] = await connection.query(`select SUM(rewardmaster.Amount) as Amount from rewardmaster where Status = 1 and CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and CreditType='credit'`)

      const [DebitBalance] = await connection.query(`select SUM(rewardmaster.Amount) as Amount from rewardmaster where Status = 1 and CompanyID = ${CompanyID} and CustomerID = ${CustomerID} and CreditType='debit'`)

      let Balance = CreditBalance[0]?.Amount - DebitBalance[0]?.Amount || 0;
      console.log("Balance ====> ", Balance);

      return Balance.toFixed(2)

    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  generateOtp: (len) => {
    const length = len;
    const charset = '0123456789';
    let retVal = '';
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  },
  getProductCountByBarcodeNumber: async (Barcode, CompanyID, ShopID) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
      const db = await dbConnection(CompanyID)
      if (db.success === false) {
        return res.status(200).json(db);
      }
      connection = await db.getConnection();
      let qry = `SELECT barcodemasternew.Barcode, COUNT(barcodemasternew.ID) AS TotalQty,barcodemasternew.Status, barcodemasternew.CurrentStatus FROM barcodemasternew LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID LEFT JOIN purchasemasternew ON purchasemasternew.ID = purchasedetailnew.PurchaseID LEFT JOIN supplier ON supplier.ID = purchasemasternew.SupplierID  LEFT JOIN shop ON shop.ID = barcodemasternew.ShopID where  barcodemasternew.CompanyID = ${CompanyID} and barcodemasternew.ShopID = ${ShopID} AND barcodemasternew.Barcode = '${Barcode}' and purchasedetailnew.Status = 1 and supplier.Name != 'PreOrder Supplier'  ` + " GROUP BY barcodemasternew.Barcode, barcodemasternew.ShopID, barcodemasternew.CurrentStatus " + " HAVING barcodemasternew.Status = 1 and barcodemasternew.CurrentStatus = 'Available'";
      const [fetch] = await connection.query(qry)

      if (fetch.length) {
        if (fetch[0].Barcode === Barcode) {
          return fetch[0].TotalQty ? fetch[0].TotalQty : 0
        }
      }

      return 0;

    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  getLocatedProductCountByBarcodeNumber: async (Barcode, CompanyID, ShopID) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
      const db = await dbConnection(CompanyID)
      if (db.success === false) {
        return res.status(200).json(db);
      }
      connection = await db.getConnection();
      const [fetch] = await connection.query(`select SUM(locationmaster.Qty) as LocatedQty from locationmaster where locationmaster.CompanyID = ${CompanyID} and locationmaster.ShopID = ${ShopID} and locationmaster.Barcode = '${Barcode}' and locationmaster.Status = 1`);

      if (fetch.length) {
        return Number(fetch[0].LocatedQty);
      }

    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  },
  updateLocatedProductCount: async (CompanyID, ShopID, ProductTypeID, ProductTypeName, Barcode, Location) => {
    let connection;
    try {
      // const db = await dbConfig.dbByCompanyID(CompanyID);
      const db = await dbConnection(CompanyID)
      if (db.success === false) {
        return res.status(200).json(db);
      }
      connection = await db.getConnection();
      if (Location.length) {
        for (let item of Location) {

          const [fetch] = await connection.query(`select ID, Qty from locationmaster where Status = 1 and CompanyID = ${CompanyID} and ShopID = ${ShopID} and ProductTypeID = ${ProductTypeID} and ProductTypeName = '${ProductTypeName}' and Barcode = '${Barcode}' and ID = ${item.LocationMasterID} and LocationID = ${item.LocationID}`);

          if (fetch.length) {
            let datum = {
              Qty: fetch[0].Qty - item.saleQty
            }

            console.log("updateLocatedProductCount datum ===> ", datum);


            const [update] = await connection.query(`update locationmaster set Qty = ${datum.Qty} where Status = 1 and ID = ${item.LocationMasterID} and LocationID = ${item.LocationID} and Barcode = '${Barcode}' and CompanyID = ${CompanyID} and ShopID = ${ShopID} `);

          }

        }
        return { success: true, message: 'Location Master Update Successfully' };
      }
      return { success: false, message: 'Located data not found' }

    } catch (error) {
      console.log(error);
    } finally {
      if (connection) connection.release(); // Always release the connection
    }
  }
}
