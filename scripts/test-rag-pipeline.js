const path = require('path');
const dotenv = require('dotenv');

// Load .env from root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { indexFile, queryByText } = require('../server/vectorDb.js');
const axios = require('axios');
const { LOCAL_AI_URL, EMBEDDING_MODEL } = require('../server/config.js');

async function runTest() {
    console.log("=== Starting RAG Pipeline Diagnostic ===");
    
    // 1. Check Configuration
    console.log("\n1. Checking Configuration...");
    console.log(`   LOCAL_AI_URL: ${LOCAL_AI_URL}`);
    console.log(`   EMBEDDING_MODEL: ${EMBEDDING_MODEL}`);
    
    if (!LOCAL_AI_URL) {
        console.error("❌ LOCAL_AI_URL is missing in .env");
        return;
    }

    // 2. Test AI Connection (Embeddings)
    console.log("\n2. Testing AI Embedding Endpoint...");
    const testPrompt = "Hello world";
    try {
        console.log(`   Sending request to ${LOCAL_AI_URL}/api/embeddings...`);
        const start = Date.now();
        const response = await axios.post(`${LOCAL_AI_URL}/api/embeddings`, {
            model: EMBEDDING_MODEL,
            prompt: testPrompt,
        });
        const duration = Date.now() - start;
        
        if (response.data && response.data.embedding) {
            console.log(`✅ Embedding received successfully! (Latency: ${duration}ms)`);
            console.log(`   Vector length: ${response.data.embedding.length}`);
        } else {
            console.error("❌ Response received but no embedding found:", response.data);
            return;
        }
    } catch (error) {
        console.error(`❌ Failed to connect to AI Server: ${error.message}`);
        if (error.code === 'ECONNREFUSED') {
            console.error("   -> Ensure the AI service is running on the specified port.");
        }
        return;
    }

    // 3. Test ChromaDB Indexing
    console.log("\n3. Testing ChromaDB Indexing...");
    const testCourseId = 9999; // Dummy ID
    const testFileName = "test_diagnostic.txt";
    const testContent = "This is a test document for the GIMU platform RAG system. It contains specific keywords like 'SuperSecretProject'.";
    const fileBuffer = Buffer.from(testContent, 'utf-8');
    
    const fileRecord = {
        id: 12345,
        course_id: testCourseId,
        file_name: testFileName
    };

    try {
        await indexFile(fileRecord, fileBuffer);
        console.log("✅ Indexing function completed without throwing errors.");
    } catch (error) {
        console.error("❌ Indexing failed:", error);
        return;
    }

    // 4. Test Retrieval
    console.log("\n4. Testing ChromaDB Retrieval...");
    try {
        const result = await queryByText("SuperSecretProject", testCourseId);
        if (result) {
            console.log("✅ Retrieval successful!");
            console.log(`   Retrieved text: "${result}"`);
        } else {
            console.error("❌ Retrieval returned no results (or empty).");
        }
    } catch (error) {
        console.error("❌ Retrieval failed:", error);
    }

    console.log("\n=== Diagnostic Complete ===");
}

runTest();
