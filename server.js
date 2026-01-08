const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const GMAIL_USER = process.env.GMAIL_USER || 'savise75@gmail.com';
const GMAIL_PASS = process.env.GMAIL_PASS || 'lbkilfpdazaaucgi';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS
  }
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Logistik Vision Backend attivo',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, body, photos } = req.body;

    if (!to || !Array.isArray(to) || to.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nessun destinatario specificato' 
      });
    }

    const attachments = [];
    if (photos && Array.isArray(photos) && photos.length > 0) {
      photos.forEach((photo, index) => {
        try {
          const base64Data = photo.url.split(',')[1];
          if (base64Data) {
            attachments.push({
              filename: photo.name || `foto_${index + 1}.jpg`,
              content: base64Data,
              encoding: 'base64'
            });
          }
        } catch (err) {
          console.error('Errore foto:', err);
        }
      });
    }

    const mailOptions = {
      from: `Logistik Vision <${GMAIL_USER}>`,
      to: to.join(', '),
      subject: subject,
      text: body,
      attachments: attachments
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email inviata:', info.messageId);
    
    res.json({ 
      success: true, 
      message: 'Email inviata con successo!',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Errore:', error);
    
    let errorMessage = 'Errore invio email';
    if (error.code === 'EAUTH') {
      errorMessage = 'Autenticazione Gmail fallita';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage
    });
  }
});

app.listen(PORT, () => {
  console.log('Backend Logistik Vision attivo sulla porta', PORT);
});
