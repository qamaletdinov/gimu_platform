const { ChromaClient } = require('chromadb');
const { summarizeText } = require('../server/aiAgent.js');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function debugMaterialsRoute(courseId) {
    console.log(`=== Debugging /api/courses/${courseId}/materials Route Logic ===`);
    
    if (isNaN(courseId)) {
        console.error("❌ Invalid courseId provided. Please provide a numeric course ID.");
        return;
    }

    try {
        const client = new ChromaClient();
        let collection;
        
        console.log(`\n1. Attempting to get ChromaDB collection 'gimu_collection'...`);
        try {
            collection = await client.getCollection({ name: "gimu_collection" });
            console.log("✅ Collection 'gimu_collection' found.");
        } catch (e) {
            console.error(`❌ Collection 'gimu_collection' not found: ${e.message}`);
            // This is the 404 case, not the 500 the user reported
            return; 
        }

        console.log(`\n2. Querying collection for courseId: ${courseId}...`);
        const numericCourseId = parseInt(courseId, 10);
        const results = await collection.get({ where: { "courseId": numericCourseId }, include: ["documents"] });
        
        console.log("✅ Query completed. Results structure:");
        console.log(JSON.stringify(results, null, 2));

        const combinedContent = results.documents.length > 0 ? 
                                results.documents.join('\n\n---\n\n') : 
                                "Dummy content for summarization test. This is a test paragraph about something important.";
        
        console.log(`\n3. Found ${results.documents.length} documents. Attempting to combine and summarize...`);
        
        // Log a snippet of the combined content to ensure it's not huge/empty
        console.log("Combined content snippet (first 500 chars):");
        console.log(combinedContent.substring(0, 500) + (combinedContent.length > 500 ? '...' : ''));

        const summary = await summarizeText(combinedContent);
        console.log("✅ Summarization successful!");
        console.log("--- Summary ---");
        console.log(summary.substring(0, 500) + (summary.length > 500 ? '...' : '')); // Snippet of summary
        console.log("---------------");

    } catch (error) {
        console.error("❌ An unexpected error occurred during debugMaterialsRoute:", error);
    }
    console.log("\n=== Debugging Complete ===");
}

// Use courseId 1 as reported by the user
debugMaterialsRoute(1);
