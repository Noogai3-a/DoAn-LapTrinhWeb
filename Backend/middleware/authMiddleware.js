module.exports = (req, res, next) => {
  console.log('❗ authMiddleware hit, session.user =', req.session.user||req.session.admin);
  if (!req.session.user && !req.session.admin) {
    return res.redirect('/login');
  }
  req.user = req.session.user || req.session.admin;
  next();
};
 