require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// MCP Sunucusu (web araması için)
// Groq'un MCP sunucusu, web aramasını yönetir
const MCP_SERVER_URL = 'https://api.groq.com/mcp/v1';

app.post('/api/chat', async (req, res) => {
    try {
        const { messages, userProfile } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ success: false, error: 'Mesaj göndermedin!' });
        }

        // Son kullanıcı mesajını al
        const userMessage = messages[messages.length - 1]?.text || '';

        // Sistem promptu
        const systemPrompt = `Senin adın ORYN. 13 yaşındaki Gurur ile konuşuyorsun. Kullanıcı profili: ${userProfile || 'Gurur'}. Eğer bir soru güncel bilgi gerektiriyorsa (hava durumu, haber, maç sonucu, güncel olaylar vb.) web araması yapmalısın.`;

        // 🧠 GROQ MCP SUNUCUSUNA İSTEK
        // Burada web aramasını MCP sunucusu üzerinden yapıyoruz
        const mcpResponse = await axios.post(
            `${MCP_SERVER_URL}/ask`,
            {
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages.map(m => ({
                        role: m.role === 'assistant' ? 'assistant' : 'user',
                        content: m.text
                    }))
                ],
                tools: [
                    {
                        type: 'mcp',  // ✅ DOĞRU TİP!
                        name: 'web_search',
                        // MCP sunucusu bu aracı tanıyor
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

        let reply = mcpResponse.data.choices?.[0]?.message?.content || 'Üzgünüm, cevap veremedim.';

        // Eğer MCP sunucusu araç çağrısı yaptıysa, sonucu işle
        if (mcpResponse.data.choices?.[0]?.message?.tool_calls) {
            const toolCall = mcpResponse.data.choices[0].message.tool_calls[0];
            if (toolCall?.function?.name === 'web_search') {
                // Web araması sonucunu al
                const searchResult = toolCall.function.arguments;
                reply = `Web araması sonucu: ${searchResult}`;
            }
        }

        res.json({ success: true, reply: reply });

    } catch (error) {
        console.error('❌ Backend hatası:', error.response?.data || error.message);
        
        // Hata detayını göster
        const errorMessage = error.response?.data?.error?.message || 'Bir hata oluştu.';
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ORYN MCP ile çalışıyor! 🚀' });
});

app.listen(PORT, () => {
    console.log(`🔮 ORYN MCP backend ${PORT} portunda çalışıyor`);
});
