// middleware/apiAuthMiddleware.js
module.exports = (req, res, next) => {
  const user = req.session.user || req.session.admin;

  if (!user) {
    return res.status(401).json({ message: "Chưa đăng nhập hoặc phiên đã hết hạn." });
  }

  req.user = user; // truyền user xuống controller
  next();
};
