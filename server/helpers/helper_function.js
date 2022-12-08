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
    }
  }