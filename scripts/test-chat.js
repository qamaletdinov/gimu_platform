const { summarizeText } = require('../server/aiAgent.js');
const { LOCAL_AI_URL, CHAT_MODEL } = require('../server/config.js');
const axios = require('axios');

async function testSummarization() {
    console.log("=== Starting Summarization Test ===");
    console.log(`LOCAL_AI_URL: ${LOCAL_AI_URL}`);
    console.log(`CHAT_MODEL: ${CHAT_MODEL}`);

    // Test simple connectivity first
    console.log("\n1. Testing Chat API Connectivity...");
    try {
        const testPrompt = "Say 'Hello' and nothing else.";
        const response = await axios.post(`${LOCAL_AI_URL}/api/chat`, {
            model: CHAT_MODEL,
            messages: [{ role: 'user', content: testPrompt }],
            stream: false,
        });
        console.log(`✅ Chat API responded: "${response.data.message.content}"`);
    } catch (error) {
        console.error("❌ Chat API Connectivity failed:", error.message);
        if(error.response) console.error("   Status:", error.response.status);
        return;
    }

    // Test summarization function
    console.log("\n2. Testing summarizeText function...");
    const sampleText = "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water. Photosynthesis in plants generally involves the green pigment chlorophyll and generates oxygen as a byproduct.";
    
    try {
        const start = Date.now();
        const summary = await summarizeText(sampleText);
        const duration = Date.now() - start;
        console.log(`✅ Summarization successful! (Duration: ${duration}ms)`);
        console.log("--- Summary Output ---");
        console.log(summary);
        console.log("----------------------");
    } catch (error) {
        console.error("❌ summarizeText failed:", error);
    }
    console.log("\n=== Test Complete ===");
}

testSummarization();
