const JWT = require('jsonwebtoken')
const createError = require('http-errors')
require('dotenv').config();
const client = require('./init_redis')



module.exports = {
  signAccessTokenAdmin: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {}
      const secret = process.env.ACCESS_TOKEN_SECRET
      const options = {
        expiresIn: '1d',
        issuer: 'pickurpage.com',
        audience: userId,
      }
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message)
          reject(createError.InternalServerError())
          return
        }
        resolve(token)
      })
    })
  },
  verifyAccessTokenAdmin: (req, res, next) => {
    if (!req.headers['authorization']) return next(createError.Unauthorized())
    const authHeader = req.headers['authorization']
    const bearerToken = authHeader.split(' ')
    const token = bearerToken[1]
    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, payload) => {
      if (err) {
        const message =
          err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message
        return next(createError.Unauthorized(message))
      }

      // const user = await User.findOne({ _id: mongoose.Types.ObjectId(payload.aud) }, {passwordConfirm: 0, __v: 0,  password: 0})
      // console.log(user , payload.aud, 'user');
      // const role = await Role.findOne({ _id: user.role })
      // req.user = user
      // req.role = role
      // if (permissionData && !(req.role.permission[permissionData.permission[0]][permissionData.permission[1]])) {
      //   const message = 'Unauthorized'
      //   return next(createError.Unauthorized(message))
      // }
      req.payload = payload
      next()
    })
  },
  signRefreshTokenAdmin: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {}
      const secret = process.env.REFRESH_TOKEN_SECRET
      const options = {
        expiresIn: '1y',
        issuer: 'pickurpage.com',
        audience: userId,
      }
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          reject(createError.InternalServerError())
        }
          resolve(token)
      })
    })
  },
  verifyRefreshTokenAdmin: (refreshToken) => {
    return new Promise((resolve, reject) => {
      JWT.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, payload) => {
          if (err) return reject(createError.Unauthorized())
          const userId = payload.aud
          client.GET(userId, (err, result) => {
            if (err) {
              console.log(err.message)
              reject(createError.InternalServerError())
              return
            }
            if (refreshToken === result) return resolve(userId)
            reject(createError.Unauthorized())
          })
        }
      )
    })
  },
}