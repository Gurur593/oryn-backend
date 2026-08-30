require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// 📌 Groq MCP Sunucusu (Web Araması İçin)
// Bu bölüm, Groq'un MCP sunucusuna istek atar. 
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MCP_URL = 'https://api.groq.com/mcp/v1/ask_with_realtime_information'; 

app.post('/api/chat', async (req, res) => {
    try {
        const { messages, userProfile } = req.body;

        // 📝 Mesajları kontrol et
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ success: false, error: 'Mesaj göndermedin!' });
        }

        // 📦 Son mesajı al (kullanıcının yazdığı)
        const userMessage = messages[messages.length - 1]?.text || '';

        // 🧠 Sistem mesajı (ORYN'in kişiliği)
        const systemPrompt = `Senin adın ORYN. 13 yaşındaki Gurur ile konuşuyorsun. Kullanıcı profili: ${userProfile || 'Gurur'}. Eğer bir soru güncel bilgi gerektiriyorsa (hava durumu, haber, maç sonucu, güncel olaylar vb.) web araması yapmalısın.`;

        // 📨 Groq MCP Sunucusuna istek
        const response = await axios.post(
            MCP_URL,
            {
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages.map(m => ({
                        role: m.role === 'assistant' ? 'assistant' : 'user',
                        content: m.text
                    }))
                ],
                tools: ['realtime_information'] // Web araması için bu tool aktif
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                }
            }
        );

        // ✅ Yanıtı al
        const reply = response.data.choices?.[0]?.message?.content || 'Üzgünüm, cevap veremedim.';
        res.json({ success: true, reply: reply });

    } catch (error) {
        console.error('❌ Backend hatası:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error?.message || 'Bir hata oluştu.'
        });
    }
});

// 🩺 Sağlık kontrolü
app.get('/api/health', (req, res) => {
    res.json({ status: 'ORYN MCP ile çalışıyor! 🚀' });
});

app.listen(PORT, () => {
    console.log(`🔮 ORYN MCP backend ${PORT} portunda çalışıyor`);
});
