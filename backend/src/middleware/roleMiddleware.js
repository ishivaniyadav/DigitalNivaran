const requireAuthority = (req, res, next) => {
  if (!req.user || req.user.role !== "authority") {
    return res.status(403).json({
      success: false,
      message: "Authority access required"
    })
  }

  next()
}


module.exports = requireAuthority