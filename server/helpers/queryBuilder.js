

module.exports = {
    getQuery: async (TableName, Body, LoggedOnUser, CompanyID, ShopID) => {
        let qry = "";
        switch (TableName) {
            case "Product":
                if (Body.ID === null || Body.ID === undefined) {
                    qry = `insert into ${TableName} (Name,  CompanyID, HSNCode,GSTPercentage,GSTType, Status, CreatedBy , CreatedOn ) values ('${Body.Name}', ${CompanyID}, '${Body.HSNCode}', ${Body.GSTPercentage}, '${Body.GSTType}', 1 , ${LoggedOnUser.ID}, now())`;
                } else {
                    qry = `update ${TableName} set Name = '${Body.Name}' , CompanyID = ${CompanyID} , HSNCode = '${Body.HSNCode}', GSTPercentage = ${Body.GSTPercentage}, GSTType = '${Body.GSTType}' ,Status = 1 , UpdatedOn = now(), UpdatedBy = ${LoggedOnUser.ID} where ID = ${Body.ID}`;
                }
                break;
            case "getProduct":
                qry = `select product.*, user.Name as CreatedPerson, users.Name as UpdatedPerson from product left join user on user.ID = product.CreatedBy left join user as users on users.ID = product.UpdatedBy where product.Status = 1 and product.CompanyID = ${CompanyID}`;
                break;


                case "ProductSpec":
                    if (Body.ID === null || Body.ID === undefined) {
                        qry = `insert into ${TableName} (ProductName,  CompanyID, Name, Required, Seq,  Type,  Ref,  SptTableName, Status, CreatedBy , CreatedOn ) values ('${Body.ProductName}', '${CompanyID}', '${Body.Name}', ${Body.Required}, '${Body.Seq}', '${Body.Type}', '${Body.Ref}','${Body.SptTableName}', 1 , '${LoggedOnUser.ID}', now())`;
                    } else {
                        qry = `update ${TableName} set ProductName = '${Body.ProductName}' , CompanyID = '${CompanyID}' , Name = '${Body.Name}',  Required = ${Body.Required}, Seq = '${Body.Seq}' , Type = '${Body.Type}' , Ref = '${Body.Ref}' , SptTableName = '${Body.SptTableName}' ,Status = 1 , UpdatedOn = now(), UpdatedBy = '${LoggedOnUser.ID}' where ID = ${Body.ID}`;
                    }
                    break;
        }

        return qry;
    }
}