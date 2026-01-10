const express = require('express');
const path = require('path');

const app = express();

// Static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Basic routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>HM CAR - Working</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #0b1f3a, #1a3a52);
                color: #fff;
                text-align: center;
                padding: 50px;
                margin: 0;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            .logo {
                font-size: 3rem;
                color: #d4af37;
                margin-bottom: 20px;
                text-shadow: 0 4px 20px rgba(212, 175, 55, 0.5);
            }
            .message {
                font-size: 1.2rem;
                margin-bottom: 30px;
                max-width: 600px;
                line-height: 1.6;
            }
            .links {
                display: flex;
                gap: 20px;
                flex-wrap: wrap;
                justify-content: center;
            }
            .btn {
                display: inline-block;
                padding: 15px 30px;
                background: linear-gradient(135deg, #d4af37, #ffd700);
                color: #0b1f3a;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                transition: all 0.3s ease;
                box-shadow: 0 8px 25px rgba(212, 175, 55, 0.3);
            }
            .btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 12px 35px rgba(212, 175, 55, 0.4);
            }
        </style>
    </head>
    <body>
        <div class="logo">🚗 HM CAR</div>
        <div class="message">
            <h1>مرحباً بك في HM CAR!</h1>
            <p>منصة مزادات السيارات الفاخرة في المملكة العربية السعودية</p>
            <p>Welcome to HM CAR! Luxury Car Auctions in Saudi Arabia</p>
        </div>
        <div class="links">
            <a href="/auth/login" class="btn">تسجيل الدخول</a>
            <a href="/cars" class="btn">استكشف السيارات</a>
        </div>
    </body>
    </html>
  `);
});

// Login page
app.get('/auth/login', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>HM CAR - Login</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #0b1f3a, #1a3a52);
                color: #fff;
                text-align: center;
                padding: 50px;
                margin: 0;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            .logo {
                font-size: 3rem;
                color: #d4af37;
                margin-bottom: 20px;
                text-shadow: 0 4px 20px rgba(212, 175, 55, 0.5);
            }
            .form-container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(212, 175, 55, 0.2);
                border-radius: 20px;
                padding: 40px;
                max-width: 400px;
                width: 100%;
            }
            .input {
                width: 100%;
                padding: 15px;
                margin: 10px 0;
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid rgba(212, 175, 55, 0.2);
                border-radius: 10px;
                color: #fff;
                font-size: 16px;
            }
            .input:focus {
                outline: none;
                border-color: #d4af37;
            }
            .btn {
                width: 100%;
                padding: 15px;
                background: linear-gradient(135deg, #d4af37, #ffd700);
                color: #0b1f3a;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 20px;
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(212, 175, 55, 0.3);
            }
            .back {
                margin-top: 20px;
                color: #d4af37;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="logo">🚗 HM CAR</div>
        <div class="form-container">
            <h2>تسجيل الدخول</h2>
            <form>
                <input type="text" class="input" placeholder="اسم المستخدم أو البريد الإلكتروني">
                <input type="password" class="input" placeholder="كلمة المرور">
                <button type="submit" class="btn">تسجيل الدخول</button>
            </form>
            <a href="/" class="back">العودة للرئيسية</a>
        </div>
    </body>
    </html>
  `);
});

// Export for serverless
module.exports = app;
