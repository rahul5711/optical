

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

            case "companysetting":
                if (Body.ID === null || Body.ID === undefined) {
                    qry = `insert into ${TableName} (CompanyID,  CompanyLanguage, CompanyCurrency, CurrencyFormat, DateFormat, CompanyTagline, BillHeader, BillFooter, RewardsPointValidity, EmailReport, MessageReport, LogoURL, WatermarkLogoURL, WholeSalePrice, RetailRate,Composite,Color1,HSNCode,Discount,GSTNo,Rate,SubTotal,Total,CGSTSGST, InvoiceOption, Locale,  LoginTimeStart, LoginTimeEnd, Status, CreatedBy , CreatedOn, BillFormat, WelComeNote, SenderID, SmsSetting, year, month, partycode, type,DataFormat,RewardExpiryDate,RewardPercentage,AppliedReward,MobileNo,FontApi,FontsStyle,BarCode, FeedbackDate,ServiceDate,DeliveryDay,AppliedDiscount) values ('${CompanyID}', '${Body.CompanyLanguage}', '${Body.CompanyCurrency}', '${Body.CurrencyFormat}', '${Body.DateFormat}', '${Body.CompanyTagline}', '${Body.BillHeader}',  '${Body.BillFooter}','${Body.RewardsPointValidity}','${Body.EmailReport}','${Body.MessageReport}','${Body.LogoURL}','${Body.WatermarkLogoURL}', '${Body.WholeSalePrice}','${Body.RetailRate}','${Body.Composite}','${Body.Color1}','${Body.HSNCode}','${Body.Discount}','${Body.GSTNo}', '${Body.Rate}', '${Body.SubTotal}','${Body.Total}','${Body.CGSTSGST}','${Body.InvoiceOption}', '${Body.Locale}', '${Body.BillFormat}, '${Body.LoginTimeStart}', '${Body.LoginTimeEnd}', 1 , '${LoggedOnUser.ID}', now(), '${Body.WelComeNote}', '${Body.SenderID}', '${Body.SmsSetting}', '${Body.year}', '${Body.month}', '${Body.partycode}','${Body.type}','${Body.DataFormat}','${Body.RewardExpiryDate}','${Body.RewardPercentage}','${Body.AppliedReward}','${Body.MobileNo}','${Body.FontApi}','${Body.FontsStyle}','${Body.BarCode}','${Body.FeedbackDate}','${Body.ServiceDate}','${Body.DeliveryDay}','${Body.AppliedDiscount}')`;
                } else {
                    qry = `update ${TableName} set CompanyID = '${Body.CompanyID}' , CompanyLanguage = '${Body.CompanyLanguage}' ,  CompanyCurrency = '${Body.CompanyCurrency}' , CurrencyFormat = '${Body.CurrencyFormat}' , DateFormat = '${Body.DateFormat}' , CompanyTagline = '${Body.CompanyTagline}', BillHeader = '${Body.BillHeader}' , BillFooter = '${Body.BillFooter}' ,  RewardsPointValidity = '${Body.RewardsPointValidity}' , EmailReport = '${Body.EmailReport}' , MessageReport = '${Body.MessageReport}' , LogoURL = '${Body.LogoURL}' , WatermarkLogoURL = '${Body.WatermarkLogoURL}', WholeSalePrice = '${Body.WholeSalePrice}' , RetailRate = '${Body.RetailRate}',Color1 = '${Body.Color1}',HSNCode = '${Body.HSNCode}',Discount = '${Body.Discount}',GSTNo = '${Body.GSTNo}',Rate = '${Body.Rate}',SubTotal = '${Body.SubTotal}',Total = '${Body.Total}',CGSTSGST = '${Body.CGSTSGST}',Composite = '${Body.Composite}', InvoiceOption = '${Body.InvoiceOption}', Locale = '${Body.Locale}', LoginTimeStart = '${Body.LoginTimeStart}', LoginTimeEnd = '${Body.LoginTimeEnd}',BillFormat = '${Body.BillFormat}', Status = 1 , UpdatedOn = now(), UpdatedBy = '${LoggedOnUser.ID}', WelComeNote = '${Body.WelComeNote}' , SenderID = '${Body.SenderID}' , SmsSetting = '${Body.SmsSetting}', year = '${Body.year}', month = '${Body.month}', partycode = '${Body.partycode}', DataFormat = '${Body.DataFormat}', type = '${Body.type}', RewardExpiryDate = '${Body.RewardExpiryDate}', RewardPercentage = '${Body.RewardPercentage}', AppliedReward = '${Body.AppliedReward}' , MobileNo = '${Body.MobileNo}', FontApi = '${Body.FontApi}', FontsStyle = '${Body.FontsStyle}', BarCode = '${Body.BarCode}' , FeedbackDate = '${Body.FeedbackDate}' , ServiceDate = '${Body.ServiceDate}', DeliveryDay = '${Body.DeliveryDay}' , AppliedDiscount = '${Body.AppliedDiscount}' where ID = ${Body.ID}`;
                }
                break;
        }

        return qry;
    }
}