require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
    try {
        const { messages, userProfile } = req.body;
        
        // GELEN VERİYİ KONTROL ET
        console.log('Gelen mesaj:', messages);
        
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Mesaj göndermedin!' 
            });
        }

        const systemPrompt = `Senin adın ORYN. 13 yaşındaki Gurur ile konuşuyorsun. Kullanıcı profili: ${userProfile || 'Gurur'}`;
        
        const formattedMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.text
            }))
        ];

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'compound-beta',  // Web araması + kod çalıştırma,
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

        const reply = response.data.choices?.[0]?.message?.content || 'Üzgünüm, cevap veremedim.';
        res.json({ success: true, reply: reply });

    } catch (error) {
        console.error('Backend hatası:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: error.response?.data?.error?.message || 'Bir hata oluştu.'
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ORYN çalışıyor! 🚀' });
});

app.listen(PORT, () => {
    console.log(`🔮 ORYN backend ${PORT} portunda çalışıyor`);
});
