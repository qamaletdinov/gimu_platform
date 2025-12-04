const { ChromaClient } = require('chromadb');

async function checkCollection() {
  const client = new ChromaClient();
  try {
    const collection = await client.getCollection({ name: "gimu_collection" });
    const count = await collection.count();
    console.log(`Total documents in 'gimu_collection': ${count}`);

    if (count > 0) {
      const results = await collection.get({
        limit: 10,
        include: ["metadatas", "documents"]
      });
      console.log("Sample documents (first 10):");
      results.metadatas.forEach((meta, index) => {
        console.log(`[${index}] Course ID: ${meta.courseId}, File: ${meta.fileName}`);
      });
    } else {
      console.log("Collection is empty.");
    }
  } catch (error) {
    console.error("Error accessing ChromaDB:", error);
  }
}

checkCollection();
