require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));

app.post('/api/chat', async (req, res) => {
    try {
        const { messages, userProfile } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ success: false, error: 'Mesaj göndermedin!' });
        }

        const systemPrompt = `Senin adın ORYN. 13 yaşındaki Gurur ile konuşuyorsun. Kullanıcı profili: ${userProfile || 'Gurur'}. Eğer bir soru güncel bilgi gerektiriyorsa, web araması yaparak cevap vermelisin.`;

        const formattedMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.text
            }))
        ];

        // 🔥 BURASI DEĞİŞTİ! Model llama-3.1-8b-instant, tools parametresi eklendi.
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: formattedMessages,
                max_tokens: 4096,
                tools: [ // 🛠️ Web araması için tools parametresi
                    {
                        type: 'web_search',
                        // Bu parametre isteğe bağlıdır, Google veya diğer arama motorları için kullanılabilir.
                    }
                ],
                tool_choice: 'auto'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                }
            }
        );

        let reply = response.data.choices?.[0]?.message?.content || 'Üzgünüm, cevap veremedim.';

        // Eğer model tool çağrısı yaparsa, burada işlenebilir.
        // Ancak şu an için doğrudan içeriği alıyoruz.

        res.json({ success: true, reply: reply });

    } catch (error) {
        console.error('❌ Backend hatası:', error.response?.data || error.message);
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
