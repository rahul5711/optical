const getConnection = require('../helpers/db')

module.exports = {

    shopID: async(header) => {
      return Number(JSON.parse(header.selectedshop)[0])
    },
    Idd: async(req, res, next) => {
      const connection = await getConnection.connection();
      const CompanyID = req.user.CompanyID ? req.user.CompanyID : 0;
      const customer = await connection.query(`select * from customer where CompanyID = ${CompanyID}`)
      let Idd = customer.length
      return Idd + 1;
    },
    generateVisitNo : async(CompanyID, CustomerID, TableName) => {
      const connection = await getConnection.connection();
      const visitNo = await connection.query(`select * from ${TableName} where CompanyID = ${CompanyID} and CustomerID = ${CustomerID}`)

      return visitNo.length + 1;
    },
    generateBarcode : async(CompanyID, BarcodeType) => {
      const connection = await getConnection.connection();
      const barcode = await connection.query(`select barcode.${BarcodeType} from barcode where Status = 1 and CompanyID=${CompanyID}`);
      if (BarcodeType==='SB') {
        const updateBarcode = await connection.query(`update barcode set ${BarcodeType} = ${Number(barcode[0].SB) + 1}`)
        return Number(barcode[0].SB)
      } else if(BarcodeType==='PB') {
        const updateBarcode = await connection.query(`update barcode set ${BarcodeType} = ${Number(barcode[0].PB) + 1}`)
        return Number(barcode[0].PB)
      } else if(BarcodeType==='MB') {
        const updateBarcode = await connection.query(`update barcode set ${BarcodeType} = ${Number(barcode[0].MB) + 1}`)
        return Number(barcode[0].MB)
      }
    },
    doesExistProduct: async(Body) => {
      const connection = await getConnection.connection();
      let qry = `SELECT MAX(Barcode) AS MaxBarcode FROM PurchaseDetail LEFT JOIN BarcodeMaster ON BarcodeMaster.PurchaseDetailID = PurchaseDetail.ID WHERE ProductName = '${Body.ProductName}' AND ProductTypeName = '${Body.ProductTypeName}' AND PurchaseDetail.RetailPrice = '${Body.RetailPrice}' AND PurchaseDetail.UnitPrice = '${Body.UnitPrice}' AND PurchaseDetail.MultipleBarcode = ${Body.Multiple} AND PurchaseDetail.CompanyID = '${CompanyID}'AND PurchaseDetail.Status = 1`;

      const barcode = await connection.query(qry)
      return barcode[0].MaxBarcode

    }
  }
