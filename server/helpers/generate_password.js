const bcrypt = require('bcrypt')

module.exports = { 
    hash_password: async(pass) => {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(pass, salt)
      return hashedPassword
    },
    is_valid_password: async(newPassword, oldPassword) => {
      return await bcrypt.compare(newPassword, oldPassword)
    }
  }
  
