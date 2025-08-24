export default function handler(req, res) {
  // Don't reveal the token value; just say if it's set
  const isSet = Boolean(process.env.VERIFY_TOKEN && process.env.VERIFY_TOKEN.length);
  res.status(200).json({ verifyTokenLoaded: isSet });
}
