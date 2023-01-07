const getConnection = require('../helpers/db')
const pass_init = require('./generate_password')
const chalk = require('chalk');
const connected = chalk.bold.cyan;
const init = async () => {
    try {
        const connection = await getConnection.connection();

        const doesExist = await connection.query(`select * from User where UserGroup = 'SuperAdmin' and Status = 1`)

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

            const savedata = await connection.query(`insert into User(ID,CompanyID,Name,UserGroup,DOB,Anniversary,MobileNo1,MobileNo2,PhoneNo,Email,Address,Branch,PhotoURL,Document,LoginName,Password,Status,CreatedBy,UpdatedBy,CreatedOn,UpdatedOn,CommissionType,CommissionMode,CommissionValue,CommissionValueNB) values(${datum.ID},${datum.CompanyID},'${datum.Name}','${datum.UserGroup}','${datum.DOB}','${datum.Anniversary}','${datum.MobileNo1}','${datum.MobileNo2}','${datum.PhoneNo}','${datum.Email}','${datum.Address}','${datum.Branch}','${datum.PhotoURL}','${datum.Document}','${datum.LoginName}','${datum.Password}',${datum.Status},${datum.CreatedBy},${datum.UpdatedBy},now(),now(),${datum.CommissionType},${datum.CommissionMode},${datum.CommissionValue},${datum.CommissionValueNB})`)


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

            // const update_data = await connection.query(``)


            console.log(connected("Super Admin Updated SuccessFully !!!!"));


        }

        // connection.release()

    } catch (error) {
        throw error
    }
}


const product = async () => {
    try {
        const connection = await getConnection.connection();

        const product = await connection.query(`SELECT ${0} as CompanyID ,product.Name, product.HSNCode, product.GSTPercentage,product.GSTType, product.Status, 0 AS CreatedBy, NOW() AS CreatedOn FROM product WHERE STATUS = 1 AND CompanyID = 0`)
        let result = []
        if (product) {
            result = JSON.parse(JSON.stringify(product))
        }

        if (result) {

            for (const item of result) {
                const saveProduct = await connection.query(`insert into product(CompanyID, Name, HSNCode,GSTPercentage,GSTType,Status,CreatedBy,CreatedOn) values(${item.CompanyID}, '${item.Name}', '${item.HSNCode}',${item.GSTPercentage}, '${item.GSTType}', 1, 0, now())`)
            }

            console.log(connected("Product Assign SuccessFully !!!!"));

        }

        const productSpec = await connection.query(`select * from productspec where Status = 1 and CompanyID = 0`)
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
                    const saveSpec = await connection.query(`insert into productspec(ProductName, CompanyID, Name,Seq,Type,Ref,SptTableName,Status,CreatedBy,CreatedOn)values('${item.ProductName}', 122, '${item.Name}', '${item.Seq}', '${item.Type}', '${item.Ref}', '${item.SptTableName}',1,0,now())`)
                } else if (item.Type !== 'DropDown') {
                    const saveSpec = await connection.query(`insert into productspec(ProductName, CompanyID, Name,Seq,Type,Ref,SptTableName,Status,CreatedBy,CreatedOn)values('${item.ProductName}', 122, '${item.Name}', '${item.Seq}', '${item.Type}', '${item.Ref}', '${item.SptTableName}',1,0,now())`)
                }
            }

            console.log(connected("ProductSpec Assign SuccessFully !!!!"));

        }

    } catch (error) {
        throw error

    }
}

const product_support = async () => {
    try {
        const connection = await getConnection.connection();
        // spec spt table data to another company

        const support_data = await connection.query(`select * from productspec where Status = 1 and CompanyID = 0 and Type = 'DropDown'`)
        let support_data_result = []
        if (support_data) {
            support_data_result = JSON.parse(JSON.stringify(support_data))
        }

        let complete_data = []

        if (support_data_result) {
            complete_data = []
            for (const item of support_data_result) {

                let result = await connection.query(`select * from specspttable where Status = 1 and TableName = '${item.SptTableName}'`)
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
                let TableName = await connection.query(`select * from productspec where Status = 1 and ProductName = '${item.ProductName}' and Type = 'DropDown' and Name = '${item.Name}' and CompanyID = 134`)
                if (TableName) {
                    TableName = JSON.parse(JSON.stringify(TableName))
                }
                item.SptTableName = TableName[0].SptTableName
                // item.RefID = TableName[0].Ref

                console.log(item , 'tablename');
                // let saveData = await connection.query(`insert into SpecSptTable (TableName,  RefID, TableValue, Status,UpdatedOn,UpdatedBy) values ('${item.TableName}','${item.Ref}','${item.SelectedValue}',1,now(),${LoggedOnUser.ID})`)
            }
        }


    } catch (error) {
        throw error

    }
}



// product()
init()
// product_support()