

module.exports = {
    getQuery: async (TableName,Body, LoggedOnUser, CompanyID, ShopID) => {
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
        }

        return qry;
    }
}