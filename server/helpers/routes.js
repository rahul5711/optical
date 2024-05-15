const addRoutes = (app) => {
app.use('/', require('../routes/index'));
app.use('/company', require('../routes/company.route'));
app.use('/login', require('../routes/login.route'));
app.use('/product', require('../routes/product.route'));
app.use('/file', require('../routes/file.route'));
app.use('/support', require('../routes/support.route'));
app.use('/shop', require('../routes/shop.route'));
app.use('/role', require('../routes/role.route'));
app.use('/employee', require('../routes/employee.route'));
app.use('/supplier', require('../routes/supplier.route'));
app.use('/doctor', require('../routes/doctor.route'));
app.use('/fitter', require('../routes/fitter.route'));
app.use('/expense', require('../routes/expense.route'));
app.use('/payroll', require('../routes/payroll.route'));
app.use('/pettycash', require('../routes/pettycash.route'));
app.use('/customer', require('../routes/customer.route'));
app.use('/purchase', require('../routes/purchase.route'));
app.use('/purchaseUpload', require('../routes/uploader.route'));
app.use('/bill', require('../routes/bill.route'));
app.use('/payment', require('../routes/payment.route'));
app.use('/reminder', require('../routes/reminder.route'));
app.use('/dm', require('../routes/datamerge.route'));
app.use('/ledge', require('../routes/ledge.route'));
}

module.exports = { addRoutes };
