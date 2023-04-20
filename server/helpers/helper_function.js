const getConnection = require('../helpers/db')
const moment = require("moment");

module.exports = {

  shopID: async (header) => {
    return Number(JSON.parse(header.selectedshop)[0])
  },
  Idd: async (req, res, next) => {
    const connection = await getConnection.connection();
    const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
    const customer = await connection.query(`select * from customer where CompanyID = ${CompanyID}`)
    let Idd = customer.length
    return Idd + 1;
  },
  generateVisitNo: async (CompanyID, CustomerID, TableName) => {
    const connection = await getConnection.connection();
    const visitNo = await connection.query(`select * from ${TableName} where CompanyID = ${CompanyID} and CustomerID = ${CustomerID}`)

    return visitNo.length + 1;
  },
  generateBarcode: async (CompanyID, BarcodeType) => {
    const connection = await getConnection.connection();
    const barcode = await connection.query(`select barcode.${BarcodeType} from barcode where Status = 1 and CompanyID=${CompanyID}`);
    if (BarcodeType === 'SB') {
      const updateBarcode = await connection.query(`update barcode set ${BarcodeType} = ${Number(barcode[0].SB) + 1}`)
      return Number(barcode[0].SB)
    } else if (BarcodeType === 'PB') {
      const updateBarcode = await connection.query(`update barcode set ${BarcodeType} = ${Number(barcode[0].PB) + 1}`)
      return Number(barcode[0].PB)
    } else if (BarcodeType === 'MB') {
      const updateBarcode = await connection.query(`update barcode set ${BarcodeType} = ${Number(barcode[0].MB) + 1}`)
      return Number(barcode[0].MB)
    }
  },
  doesExistProduct: async (CompanyID, Body) => {
    const connection = await getConnection.connection();
    let qry = `SELECT MAX(BaseBarCode) AS MaxBarcode FROM purchasedetailnew WHERE ProductName = '${Body.ProductName}' AND ProductTypeName = '${Body.ProductTypeName}' AND purchasedetailnew.RetailPrice = ${Body.RetailPrice} AND purchasedetailnew.UnitPrice = ${Body.UnitPrice} AND purchasedetailnew.MultipleBarcode = ${Body.Multiple} AND purchasedetailnew.CompanyID = '${CompanyID}'AND purchasedetailnew.Status = 1`;

    const barcode = await connection.query(qry)
    return Number(barcode[0].MaxBarcode) ? Number(barcode[0].MaxBarcode) : 0

  },
  generateUniqueBarcode: async (CompanyID, SupplierID, Body) => {
    const connection = await getConnection.connection();
    const fetchcompanysetting = await connection.query(`select * from companysetting where Status = 1 and CompanyID = ${CompanyID} `)

    let NewBarcode = ''; // blank initiate uniq barcode
    year = moment(new Date()).format('YY');
    month = moment(new Date()).format('MM');
    partycode = '0'

    const fetchSupplier = await connection.query(`select * from supplier where Status = 1 and CompanyID = ${CompanyID} and ID = ${SupplierID}`)

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
  },
  gstDetail: async (CompanyID, PurchaseID) => {
    const connection = await getConnection.connection();
    let gstTypes = await connection.query(`select * from supportmaster where CompanyID = ${CompanyID} and Status = 1 and TableName = 'TaxType'`)
    gstTypes = JSON.parse(JSON.stringify(gstTypes)) || []
    const values = []
    if (gstTypes.length) {
      for (const item of gstTypes) {
        let value = await connection.query(`select SUM(GSTAmount) as Amount, GSTType from purchasedetailnew where CompanyID = ${CompanyID} and PurchaseID = ${PurchaseID} and Status = 1 and GSTType = '${item.Name}'`)
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
        let value = await connection.query(`select SUM(GSTAmount) as Amount, GSTType from purchasecharge where CompanyID = ${CompanyID} and PurchaseID = ${PurchaseID} and Status = 1 and GSTType = '${item.Name}'`)
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
  },
  discountAmount: async (item) => {
    let discountAmount = 0
    discountAmount = (item.UnitPrice * item.Quantity) * item.DiscountPercentage / 100;
    return discountAmount
  },
  gstAmount: async(SubTotal, GSTPercentage) => {
    let gstAmount = 0
    gstAmount = (SubTotal * GSTPercentage) / 100
    return gstAmount
  },
  generateInvoiceNo: async(CompanyID, ShopID, billDetailData, billMaseterData) => {
    const connection = await getConnection.connection();
    let rw = "W";
    let billShopWiseBoolean = false
    let newInvoiceID = new Date();
    if (billMaseterData.ID === null || billMaseterData.ID === undefined) {
        newInvoiceID = new Date().toISOString().replace(/[`~!@#$%^&*()_|+\-=?TZ;:'",.<>\{\}\[\]\\\/]/gi, "").substring(2, 6);
    }
    if (billDetailData.length !== 0 && !billDetailData[0].WholeSale) {
        rw = "R";
    }
    const billShopWise = await connection.query(`select * from shop where CompanyID = ${CompanyID}`);
    if (billShopWise.length) {
        if (billShopWise[0].BillShopWise == true || billShopWise[0].BillShopWise == "true") {
            billShopWiseBoolean = true
        } else {
            billShopWiseBoolean = false
        }
    }

    let lastInvoiceID = []

    if (billShopWiseBoolean) {
        lastInvoiceID = await connection.query(`SELECT ID ,InvoiceNo FROM billmaster WHERE ID IN (SELECT MAX(ID) AS MaxID FROM billmaster WHERE CompanyID = '${CompanyID}' and ShopID = ${ShopID} and InvoiceNo LIKE '${newInvoiceID}%' )`);
    } else {
        lastInvoiceID = await connection.query(`SELECT ID ,InvoiceNo FROM billmaster WHERE ID IN (SELECT MAX(ID) AS MaxID FROM billmaster WHERE CompanyID = '${CompanyID}' and InvoiceNo LIKE '${newInvoiceID}%' )`);
    }

    if (lastInvoiceID.length === 0 || lastInvoiceID[0].MaxID === null ||
        lastInvoiceID[0].InvoiceNo.substring(0, 4) !== newInvoiceID
    ) {
        newInvoiceID = newInvoiceID + rw + "00001";
    } else {
        let temp3 = lastInvoiceID[0].InvoiceNo;
        let temp1 = parseInt(temp3.substring(10, 5)) + 1;
        let temp2 = "0000" + temp1;
        newInvoiceID = newInvoiceID + rw + temp2.slice(-5);
    }

    return newInvoiceID
  },
  generateBillSno: async (CompanyID, ShopID) => {
    const connection = await getConnection.connection();
    const sNo = await connection.query(`select * from billmaster where CompanyID = ${CompanyID} and ShopID = ${ShopID}`)

    return sNo.length + 1;
  },

}
