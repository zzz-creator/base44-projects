const express = require('express');
const router = express.Router();
const { poolPromise } = require('../db');
const crypto = require('crypto');

// Generate SAS (Strategic Authentication System) codes
router.post('/generate', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Generate two unique 6-character hex codes
    const code1 = crypto.randomBytes(3).toString('hex').toUpperCase();
    const code2 = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    // Store in database with expiration (15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    const result = await pool.request()
      .input('code1', code1)
      .input('code2', code2)
      .input('expiresAt', expiresAt)
      .query(`
        INSERT INTO SASCodes (Code1, Code2, ExpiresAt, Used)
        OUTPUT INSERTED.Id, INSERTED.Code1, INSERTED.Code2, INSERTED.ExpiresAt
        VALUES (@code1, @code2, @expiresAt, 0)
      `);
    
    res.json({
      id: result.recordset[0].Id,
      code1: result.recordset[0].Code1,
      code2: result.recordset[0].Code2,
      expiresAt: result.recordset[0].ExpiresAt
    });
  } catch (error) {
    console.error('SAS generation error:', error);
    res.status(500).json({ error: 'Failed to generate SAS codes' });
  }
});

// Verify SAS codes
router.post('/verify', async (req, res) => {
  try {
    const { id, code1, code2 } = req.body;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('id', id)
      .query(`
        SELECT Id, Code1, Code2, ExpiresAt, Used 
        FROM SASCodes 
        WHERE Id = @id
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'SAS codes not found' });
    }
    
    const sasRecord = result.recordset[0];
    
    // Check if expired
    if (new Date() > new Date(sasRecord.ExpiresAt)) {
      return res.status(400).json({ error: 'SAS codes expired' });
    }
    
    // Check if already used
    if (sasRecord.Used) {
      return res.status(400).json({ error: 'SAS codes already used' });
    }
    
    // Verify codes match
    if (sasRecord.Code1 !== code1.toUpperCase() || sasRecord.Code2 !== code2.toUpperCase()) {
      return res.status(401).json({ error: 'Invalid SAS codes' });
    }
    
    // Mark as used
    await pool.request()
      .input('id', id)
      .query(`UPDATE SASCodes SET Used = 1 WHERE Id = @id`);
    
    res.json({ success: true, message: 'SAS codes verified' });
  } catch (error) {
    console.error('SAS verification error:', error);
    res.status(500).json({ error: 'Failed to verify SAS codes' });
  }
});

module.exports = router;
