export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'NutriPulse Pro Serverless API',
    copyright: '© Ballapuram Prakash Royal. All Rights Reserved.',
    timestamp: new Date().toISOString()
  });
}
