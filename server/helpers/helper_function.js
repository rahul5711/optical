const getConnection = require('../helpers/db')
const moment = require("moment");
const { now } = require('lodash')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
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
      const updateBarcode = await connection.query(`update barcode set ${BarcodeType} = ${Number(barcode[0].SB) + 1} where CompanyID=${CompanyID}`)
      return Number(barcode[0].SB)
    } else if (BarcodeType === 'PB') {
      const updateBarcode = await connection.query(`update barcode set ${BarcodeType} = ${Number(barcode[0].PB) + 1} where CompanyID=${CompanyID}`)
      return Number(barcode[0].PB)
    } else if (BarcodeType === 'MB') {
      const updateBarcode = await connection.query(`update barcode set ${BarcodeType} = ${Number(barcode[0].MB) + 1} where CompanyID=${CompanyID}`)
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
  generateUniqueBarcodePreOrder: async (CompanyID, Body) => {
    const connection = await getConnection.connection();
    const fetchcompanysetting = await connection.query(`select * from companysetting where Status = 1 and CompanyID = ${CompanyID} `)

    let NewBarcode = ''; // blank initiate uniq barcode
    year = moment(new Date()).format('YY');
    month = moment(new Date()).format('MM');
    partycode = '0'

    // const fetchSupplier = await connection.query(`select * from supplier where Status = 1 and CompanyID = ${CompanyID} and ID = ${SupplierID}`)

    const fetchSupplier = await connection.query(`select * from supplier where CompanyID = ${CompanyID} and Name = 'PreOrder Supplier'`)

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
  gstAmount: async (SubTotal, GSTPercentage) => {
    let gstAmount = 0
    gstAmount = (SubTotal * GSTPercentage) / 100
    return gstAmount
  },
  generateInvoiceNo: async (CompanyID, ShopID, billDetailData, billMaseterData) => {
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
  generateCommission: async (CompanyID, UserType, UserID, bMasterID, billMaseterData, LoggedOnUser) => {
    const connection = await getConnection.connection();
    try {
      let commission = { Type: 0, Mode: 0, Value: 0, Amount: 0 }
      let commission1 = { Type: 0, Mode: 0, Value: 0, Amount: 0 }

      if (UserType === 'Employee') {
        let userData = await connection.query(`select * from user where user.ID = ${UserID}`);
        if (userData.length !== 0 && userData[0].CommissionType == 1) {
          commission1.Type = userData[0].CommissionType;
          if (userData[0].CommissionMode == 2) {
            commission1.Amount = userData[0].CommissionValue;
            commission1.Mode = userData[0].CommissionMode;
            commission1.Value = userData[0].CommissionValue;
          } else if (userData[0].CommissionMode == 1) {
            commission1.Type = userData[0].CommissionType;
            commission1.Amount = +billMaseterData.SubTotal * +userData[0].CommissionValue / 100;
            commission1.Mode = userData[0].CommissionMode;
            commission1.Value = userData[0].CommissionValue;
          }
        } else if (userData.length !== 0 && userData[0].CommissionType == 2) {
          let userResultB = await connection.query(`SELECT SUM(billdetail.SubTotal) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND BrandType = 1`);
          let userResultNB = await connection.query(`SELECT SUM(billdetail.SubTotal) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND BrandType <> 1`);
          commission1.Type = userData[0].CommissionType;
          if (userData[0].CommissionMode == 2) {
            // commission1.Amount = subTotal;
            // commission1.Mode = userData[0].CommissionMode;
            // commission1.Value = userData[0].CommissionValue;
          } else if (userData[0].CommissionMode == 1) {
            commission1.Type = userData[0].CommissionType;
            commission1.Amount = userResultB[0].SubTotalVal * +userData[0].CommissionValue / 100 + userResultNB[0].SubTotalVal * +userData[0].CommissionValueNB / 100;
            commission1.Mode = userData[0].CommissionMode;
            commission1.Value = userData[0].CommissionValue;
          }
        }

        if (commission1.Type !== 0 && commission1.Amount !== 0) {
          const save = await connection.query(`insert into commissiondetail (CompanyID,ShopID,CommissionMasterID, UserType, UserID,BillMasterID, CommissionMode, CommissionType, CommissionValue, CommissionAmount, Status,CreatedBy,CreatedOn ) values (${CompanyID}, ${billMaseterData.ShopID}, 0,'Employee', ${userData[0].ID}, ${bMasterID}, ${commission1.Mode},${commission1.Type},${commission1.Value},${commission1.Amount}, 1, '${LoggedOnUser}', now())`)
          console.log(save);
        }
      } else if (UserType === 'Doctor') {
        let doctorData = await connection.query(`select * from doctor where doctor.ID = ${UserID}`);
        if (doctorData.length !== 0 && doctorData[0].CommissionType == 1) {
          commission.Type = doctorData[0].CommissionType;
          if (doctorData[0].CommissionMode == 2) {
            commission.Amount = doctorData[0].CommissionValue;
            commission.Mode = doctorData[0].CommissionMode;
            commission.Value = doctorData[0].CommissionValue;
          } else if (doctorData[0].CommissionMode == 1) {
            commission.Type = doctorData[0].CommissionType;
            commission.Amount = +billMaseterData.SubTotal * +doctorData[0].CommissionValue / 100;
            commission.Mode = doctorData[0].CommissionMode;
            commission.Value = doctorData[0].CommissionValue;
          }
        } else if (doctorData.length !== 0 && doctorData[0].CommissionType == 2) {
          let doctorResultB = await connection.query(`SELECT SUM(billdetail.SubTotal) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND BrandType = 1`);
          let doctorResultNB = await connection.query(`SELECT SUM(billdetail.SubTotal) as SubTotalVal FROM billdetail LEFT JOIN barcodemasternew ON billdetail.ID = barcodemasternew.BillDetailID LEFT JOIN purchasedetailnew ON purchasedetailnew.ID = barcodemasternew.PurchaseDetailID WHERE billdetail.BillID = '${bMasterID}' AND BrandType <> 1`);
          commission.Type = doctorData[0].CommissionType;
          if (doctorData[0].CommissionMode == 2) {
            // commission.Amount = subTotal;
            // commission.Mode = doctorData[0].CommissionMode;
            // commission.Value = doctorData[0].CommissionValue;
          } else if (doctorData[0].CommissionMode == 1) {
            commission.Type = doctorData[0].CommissionType;
            commission.Amount = doctorResultB[0].SubTotalVal * +doctorData[0].CommissionValue / 100 + doctorResultNB[0].SubTotalVal * +doctorData[0].CommissionValueNB / 100;
            commission.Mode = doctorData[0].CommissionMode;
            commission.Value = doctorData[0].CommissionValue;
          }
        }

        if (commission.Type !== 0 && commission.Amount !== 0) {
          await connection.query(`insert into commissiondetail (CompanyID,ShopID,CommissionMasterID, UserType, UserID,BillMasterID, CommissionMode, CommissionType, CommissionValue, CommissionAmount, Status,CreatedBy,CreatedOn ) values (${CompanyID}, ${billMaseterData.ShopID}, 0,'Doctor', ${billMaseterData.Doctor}, ${bMasterID}, ${commission.Mode},${commission.Type},${commission.Value},${commission.Amount},1,${LoggedOnUser}, now())`)
        }
      }
    } catch (error) {
      console.log(error);
    }


  },
  generatePreOrderProduct: async (CompanyID, ShopID, Item, LoggedOnUser) => {
    delete Item.MeasurementID
    const connection = await getConnection.connection();
    const currentStatus = "Pre Order";
    const paymentStatus = "Unpaid"
    const supplierData = await connection.query(`select * from supplier where CompanyID = ${CompanyID} and Name = 'PreOrder Supplier'`)

    const purchaseDetailData = await connection.query(`select * from purchasedetailnew left join purchasemasternew on purchasemasternew.ID = purchasedetailnew.PurchaseID where purchasemasternew.PStatus = 1 and purchasemasternew.SupplierID = ${supplierData[0].ID} and purchasemasternew.CompanyID = ${CompanyID} and purchasemasternew.ShopID = ${ShopID}`)

    if (purchaseDetailData.length <= 50) {
      console.log("Quantity less than 50");
      let updatePurchaseMasterData = []
      let updatePurchaseDetailData = []

      const purchaseMasterData = await connection.query(`select * from purchasemasternew where CompanyID = ${CompanyID} and ShopID = ${ShopID} and purchasemasternew.SupplierID = ${supplierData[0].ID}`)

      console.log(purchaseMasterData, 'purchaseMasterData');

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
        Item.Multiple = 0
        Item.Ledger = 0
        Item.BrandType = 0
        Item.WholeSale = 0
        Item.RetailPrice = 0
        Item.WholeSalePrice = 0

        //  save purchase data
        const savePurchase = await connection.query(`insert into purchasemasternew(SupplierID,CompanyID,ShopID,PurchaseDate,PaymentStatus,InvoiceNo,GSTNo,Quantity,SubTotal,DiscountAmount,GSTAmount,TotalAmount,Status,PStatus,DueAmount,CreatedBy,CreatedOn)values(${purchase.SupplierID},${purchase.CompanyID},${purchase.ShopID},now(),'${paymentStatus}','${purchase.InvoiceNo}','${purchase.GSTNo}',${purchase.Quantity},${purchase.SubTotal},${purchase.DiscountAmount},${purchase.GSTAmount},${purchase.TotalAmount},1,1,${purchase.TotalAmount}, ${LoggedOnUser}, now())`);

        console.log(connected("Data Save SuccessFUlly !!!"));

        const savePurchaseDetail = await connection.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${savePurchase.insertId},${CompanyID},'${Item.ProductName}',${Item.ProductTypeID},'${Item.ProductTypeName}', ${Item.UnitPrice},${Item.Quantity},${Item.SubTotal},${Item.DiscountPercentage},${Item.DiscountAmount},${Item.GSTPercentage},${Item.GSTAmount},'${Item.GSTType}',${Item.TotalAmount},${Item.RetailPrice},${Item.WholeSalePrice},${Item.Multiple},${Item.WholeSale},'${Item.BaseBarCode}',${Item.Ledger},1,'${Item.BaseBarCode}',0,${Item.BrandType},'${Item.UniqueBarcode}','${Item.ProductExpDate}',0,0,${LoggedOnUser},now())`)

        console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));

        //  save barcode
        let detailDataForBarCode = await connection.query(`select * from purchasedetailnew where Status = 1 and PurchaseID = ${savePurchase.insertId}`)

        if (detailDataForBarCode.length) {
          for (const item of detailDataForBarCode) {
            const barcode = Number(item.BaseBarCode) * 1000
            let count = 0;
            count = 1;
            for (j = 0; j < count; j++) {
              const saveBarcode = await connection.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn, PreOrder)values(${CompanyID},${ShopID},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}',now(),'${currentStatus}', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, now(),1)`)
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
        Item.Multiple = 0
        Item.Ledger = 0
        Item.BrandType = 0
        Item.WholeSale = 0
        Item.RetailPrice = 0
        Item.WholeSalePrice = 0

        const updatePurchaseMaster = await connection.query(`update purchasemasternew set PaymentStatus='${purchase.PaymentStatus}', Quantity = ${purchase.Quantity}, SubTotal = ${purchase.SubTotal}, DiscountAmount = ${purchase.DiscountAmount}, GSTAmount=${purchase.GSTAmount}, TotalAmount = ${purchase.TotalAmount}, DueAmount = ${purchase.TotalAmount}, UpdatedBy = ${LoggedOnUser}, UpdatedOn=now() where CompanyID = ${CompanyID} and InvoiceNo = '${purchase.InvoiceNo}' and ShopID = ${ShopID} and ID=${purchase.ID}`)

        console.log(connected("Data Save SuccessFUlly !!!"));


        const savePurchaseDetail = await connection.query(`insert into purchasedetailnew(PurchaseID,CompanyID,ProductName,ProductTypeID,ProductTypeName,UnitPrice, Quantity,SubTotal,DiscountPercentage,DiscountAmount,GSTPercentage, GSTAmount,GSTType,TotalAmount,RetailPrice,WholeSalePrice,MultipleBarCode,WholeSale,BaseBarCode,Ledger,Status,NewBarcode,ReturnRef,BrandType,UniqueBarcode,ProductExpDate,Checked,BillDetailIDForPreOrder,CreatedBy,CreatedOn)values(${purchase.ID},${CompanyID},'${Item.ProductName}',${Item.ProductTypeID},'${Item.ProductTypeName}', ${Item.UnitPrice},${Item.Quantity},${Item.SubTotal},${Item.DiscountPercentage},${Item.DiscountAmount},${Item.GSTPercentage},${Item.GSTAmount},'${Item.GSTType}',${Item.TotalAmount},${Item.RetailPrice},${Item.WholeSalePrice},${Item.Multiple},${Item.WholeSale},'${Item.BaseBarCode}',${Item.Ledger},1,'${Item.BaseBarCode}',0,${Item.BrandType},'${Item.UniqueBarcode}','${Item.ProductExpDate}',0,0,${LoggedOnUser},now())`)

        console.log(connected("PurchaseDetail Data Save SuccessFUlly !!!"));

        let detailDataForBarCode = await connection.query(
          `select * from purchasedetailnew where PurchaseID = '${purchase.ID}' ORDER BY ID DESC LIMIT 1`
        );

        if (detailDataForBarCode.length) {
          for (const item of detailDataForBarCode) {
            const barcode = Number(item.BaseBarCode) * 1000
            let count = 0;
            count = 1;
            for (j = 0; j < count; j++) {
              const saveBarcode = await connection.query(`insert into barcodemasternew(CompanyID, ShopID, PurchaseDetailID, GSTType, GSTPercentage, BarCode, AvailableDate, CurrentStatus, RetailPrice, RetailDiscount, MultipleBarcode, ForWholeSale, WholeSalePrice, WholeSaleDiscount, TransferStatus, TransferToShop, Status, CreatedBy, CreatedOn, PreOrder)values(${CompanyID},${ShopID},${item.ID},'${item.GSTType}',${item.GSTPercentage}, '${barcode}',now(),'${currentStatus}', ${item.RetailPrice},0,${item.MultipleBarCode},${item.WholeSale},${item.WholeSalePrice},0,'',0,1,${LoggedOnUser}, now(), 1)`)
            }
          }
        }

        console.log(connected("Barcode Data Save SuccessFUlly !!!"));

      }

      console.log(updatePurchaseMasterData, 'updatePurchaseMasterData');
      console.log(updatePurchaseDetailData, 'updatePurchaseDetailData');

    } else {
      let updatePurchaseMasterData = []
      let updatePurchaseDetailData = []
      console.log("Quantity greater than 50");
      // length greater than 50

      const purchaseMasterData = await connection.query(`select * from purchasemasternew where CompanyID = ${CompanyID} and ShopID = ${ShopID} and purchasemasternew.SupplierID = ${supplierData[0].ID}`)

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
          DueAmount: Item.GSTAmount + Item.TotalAmount
        }

        updatePurchaseMasterData = purchase
        updatePurchaseDetailData = Item
        Item.Multiple = 0
        Item.Ledger = 0
        Item.BrandType = 0
        Item.WholeSale = 0
        Item.RetailPrice = 0
        Item.WholeSalePrice = 0

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
        Item.Multiple = 0
        Item.Ledger = 0
        Item.BrandType = 0
        Item.WholeSale = 0
        Item.RetailPrice = 0
        Item.WholeSalePrice = 0
      }

      console.log(updatePurchaseMasterData, 'updatePurchaseMasterData');
      console.log(updatePurchaseDetailData, 'updatePurchaseDetailData');
    }



  }

}
