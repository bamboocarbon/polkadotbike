module.exports = (req, res) => {
  const country = req.headers['x-vercel-ip-country'] || null;
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ country });
};
