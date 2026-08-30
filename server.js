require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ana sohbet endpoint'i
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, userProfile } = req.body;
        
        // Sistem prompt'u
        const systemPrompt = `Senin adın ORYN. Kullanıcı profili: ${userProfile || 'Gurur'}`;
        
        // Mesajları formatla
        const formattedMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.text
            }))
        ];

        // Groq API'ye istek
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-70b-versatile',
                messages: formattedMessages,
                max_tokens: 4096
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                }
            }
        );

        const reply = response.data.choices?.[0]?.message?.content || 'Yanıt alınamadı.';
        res.json({ success: true, reply: reply });

    } catch (error) {
        console.error('Hata:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Sağlık kontrolü
app.get('/api/health', (req, res) => {
    res.json({ status: 'ORYN çalışıyor! 🚀' });
});

app.listen(PORT, () => {
    console.log(`🔮 ORYN backend ${PORT} portunda çalışıyor`);
});