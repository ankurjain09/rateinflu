import admin from "firebase-admin";
import { readFileSync } from "fs";

// Load service account key (downloaded from Firebase console)
const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Load sample JSON files
const influencers = JSON.parse(readFileSync("./influencers.json", "utf8"));
const services = JSON.parse(readFileSync("./services.json", "utf8"));
const reviews = JSON.parse(readFileSync("./reviews.json", "utf8"));

async function seed() {
  for (const [infId, infData] of Object.entries(influencers)) {
    const infRef = db.collection("influencers").doc(infId);
    await infRef.set(infData, { merge: true });
    console.log(`✅ Seeded influencer: ${infData.name}`);

    // Add services for this influencer
    for (const [svcId, svcData] of Object.entries(services)) {
      if (svcData.influencerId === infId) {
        await infRef.collection("services").doc(svcId).set(svcData, { merge: true });
        console.log(`   └─ Added service: ${svcData.title}`);
      }
    }

    // Add reviews for this influencer
    for (const [revId, revData] of Object.entries(reviews)) {
      if (revData.influencerId === infId) {
        const createdAt =
          revData.timestamp ? new Date(revData.timestamp) : new Date();
        await infRef.collection("reviews").doc(revId).set(
          {
            ...revData,
            createdAt,
          },
          { merge: true }
        );
        console.log(`   └─ Added review from ${revData.userName}`);
      }
    }
  }

  console.log("🎉 All influencers, services, and reviews seeded successfully!");
}

seed().catch((err) => console.error("❌ Error seeding Firestore:", err));
