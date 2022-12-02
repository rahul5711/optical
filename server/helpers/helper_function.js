module.exports = { 
   
    shopID: async(header) => {
      return JSON.parse(header.selectedshop)[0]
    }
  }