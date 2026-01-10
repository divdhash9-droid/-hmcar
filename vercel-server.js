const express = require('express');
const path = require('path');

const app = express();

// Static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Main page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HM CAR - مزادات السيارات الفاخرة</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #0b1f3a 0%, #1a3a52 50%, #0d2339 100%);
                color: #fff;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .container {
                text-align: center;
                max-width: 800px;
                width: 100%;
            }
            .logo {
                font-size: 4rem;
                font-weight: 800;
                color: #d4af37;
                margin-bottom: 20px;
                text-shadow: 0 4px 20px rgba(212, 175, 55, 0.5);
                animation: glow 2s ease-in-out infinite alternate;
            }
            @keyframes glow {
                from { text-shadow: 0 4px 20px rgba(212, 175, 55, 0.5); }
                to { text-shadow: 0 4px 30px rgba(212, 175, 55, 0.8); }
            }
            .title {
                font-size: 2rem;
                margin-bottom: 30px;
                color: rgba(255, 255, 255, 0.9);
            }
            .btn {
                display: inline-block;
                padding: 15px 30px;
                background: linear-gradient(135deg, #d4af37, #ffd700);
                color: #0b1f3a;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                font-size: 1.1rem;
                transition: all 0.3s ease;
                box-shadow: 0 8px 25px rgba(212, 175, 55, 0.3);
                margin: 10px;
            }
            .btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 12px 35px rgba(212, 175, 55, 0.4);
                background: linear-gradient(135deg, #ffd700, #d4af37);
            }
            .status {
                background: rgba(40, 167, 69, 0.1);
                border: 1px solid rgba(40, 167, 69, 0.3);
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                color: #51cf66;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🚗 HM CAR</div>
            <h1 class="title">مزادات السيارات الفاخرة في المملكة العربية السعودية</h1>
            
            <div class="status">
                ✅ الموقع يعمل بنجاح!
                <br>✅ The site is working successfully!
            </div>
            
            <div>
                <a href="/auth/login" class="btn">🔐 تسجيل الدخول</a>
                <a href="/cars" class="btn">🚗 استكشف السيارات</a>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Login page
app.get('/auth/login', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HM CAR - تسجيل الدخول</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #0b1f3a 0%, #1a3a52 50%, #0d2339 100%);
                color: #fff;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .login-container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(212, 175, 55, 0.2);
                border-radius: 20px;
                padding: 40px;
                width: 100%;
                max-width: 400px;
                text-align: center;
            }
            .logo {
                font-size: 3rem;
                font-weight: 800;
                color: #d4af37;
                margin-bottom: 20px;
                text-shadow: 0 4px 20px rgba(212, 175, 55, 0.5);
            }
            .title {
                font-size: 1.8rem;
                margin-bottom: 30px;
                color: #fff;
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
                transition: all 0.3s ease;
            }
            .input:focus {
                outline: none;
                border-color: #d4af37;
                background: rgba(255, 255, 255, 0.15);
            }
            .input::placeholder {
                color: rgba(255, 255, 255, 0.5);
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
                display: inline-block;
                margin-top: 20px;
                color: #d4af37;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="login-container">
            <div class="logo">🚗 HM CAR</div>
            <h1 class="title">تسجيل الدخول</h1>
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

// Export for Vercel
module.exports = app;
