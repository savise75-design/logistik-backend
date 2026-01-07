// Backend Logistik Vision - Deploy su Render.com
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configurazione Gmail - Usa variabili d'ambiente
const GMAIL_USER = process.env.GMAIL_USER || 'savise75@gmail.com';
const GMAIL_PASS = process.env.GMAIL_PASS || 'lbkilfpdazaaucgi';

// Crea transporter Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS
  }
});

// Health check endpoint
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

// Endpoint per inviare email
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, body, photos } = req.body;

    console.log('Ricevuta richiesta invio email');
    console.log('Destinatari:', to);
    console.log('Oggetto:', subject);

    // Validazione
    if (!to || !Array.isArray(to) || to.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nessun destinatario specificato' 
      });
    }

    // Prepara allegati foto
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
          console.error('Errore elaborazione foto:', err);
        }
      });
    }

    // Configurazione email
    const mailOptions = {
      from: `Logistik Vision <${GMAIL_USER}>`,
      to: to.join(', '),
      subject: subject,
      text: body,
      attachments: attachments
    };

    console.log('Invio email a:', to.join(', '));
    console.log('Allegati:', attachments.length);

    // Invia email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email inviata:', info.messageId);
    
    res.json({ 
      success: true, 
      message: 'Email inviata con successo!',
      messageId: info.messageId,
      recipients: to.length,
      attachments: attachments.length
    });

  } catch (error) {
    console.error('❌ Errore invio email:', error);
    
    let errorMessage = 'Errore invio email';
    if (error.code === 'EAUTH') {
      errorMessage = 'Autenticazione Gmail fallita. Verifica email e App Password';
    } else if (error.code === 'ESOCKET') {
      errorMessage = 'Errore di connessione. Verifica connessione internet';
    } else {
      errorMessage = error.message || 'Errore sconosciuto';
    }
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      error: error.code
    });
  }
});

// Endpoint di test
app.post('/test-email', async (req, res) => {
  try {
    const testMail = {
      from: `Logistik Vision <${GMAIL_USER}>`,
      to: GMAIL_USER,
      subject: '✅ Test Backend Logistik Vision',
      text: 'Se ricevi questa email, il backend funziona correttamente!\n\nTimestamp: ' + new Date().toISOString()
    };

    const info = await transporter.sendMail(testMail);
    
    res.json({ 
      success: true, 
      message: 'Email di test inviata!',
      messageId: info.messageId
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Avvio server
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════');
  console.log('✅ Backend Logistik Vision ATTIVO');
  console.log(`📡 Porta: ${PORT}`);
  console.log(`📧 Gmail: ${GMAIL_USER}`);
  console.log('═══════════════════════════════════════════');
});