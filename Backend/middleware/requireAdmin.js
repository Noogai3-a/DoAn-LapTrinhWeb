module.exports = (req, res, next) => {
  console.log('🔍 req.session:', req.session);

  if (req.session.admin) {
    req.user = req.session.admin;
    return next();
  }

  return res.status(403).json({ error: 'Không có quyền truy cập admin' });
};
