import express from 'express';
const router = express.Router();
router.get('/users', (req, res) => res.json([]));
export default router;