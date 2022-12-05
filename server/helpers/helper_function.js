module.exports = { 
   
    shopID: async(header) => {
      return Number(JSON.parse(header.selectedshop)[0])
    }
  }