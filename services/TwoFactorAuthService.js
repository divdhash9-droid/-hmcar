// [[ARABIC_HEADER]] هذا الملف (services/TwoFactorAuthService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * Two-Factor Authentication Service
 * خدمة المصادقة الثنائية (2FA)
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

class TwoFactorAuthService {
  /**
   * Generate 2FA secret for user
   */
  generateSecret(user) {
    const secret = speakeasy.generateSecret({
      name: `Car Auction (${user.name})`,
      issuer: 'HM Car Auction',
      length: 32
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url
    };
  }

  /**
   * Generate QR code for secret
   */
  async generateQRCode(otpauthUrl) {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify 2FA token
   */
  verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time-steps before and after
    });
  }

  /**
   * Generate backup codes
   */
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Hash backup code for storage
   */
  hashBackupCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Verify backup code
   */
  verifyBackupCode(code, hashedCodes) {
    const hashedInput = this.hashBackupCode(code);
    return hashedCodes.includes(hashedInput);
  }
}

module.exports = new TwoFactorAuthService();
