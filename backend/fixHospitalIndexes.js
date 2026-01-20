const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Hospital = require('./models/Hospital');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chulbuleMishraJi:yHTcnZwQ5WVBJiC7@chulbulemishraji.8mcwh5g.mongodb.net/mumbai_hacks_db";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ MongoDB connected for hospital index fixing');
  
  try {
    // Get the database connection
    const db = mongoose.connection.db;
    
    // Check indexes on hospitals collection
    const hospitalIndexes = await db.collection('hospitals').indexes();
    console.log('Existing hospital indexes:');
    hospitalIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Look for any email index that shouldn't be there
    const emailIndex = hospitalIndexes.find(index => index.key.email);
    if (emailIndex) {
      console.log(`\n⚠️  Found email index that should not exist: ${emailIndex.name}`);
      console.log('Attempting to drop it...');
      
      try {
        await db.collection('hospitals').dropIndex(emailIndex.name);
        console.log('✅ Email index dropped successfully');
      } catch (dropError) {
        console.log('❌ Failed to drop email index:', dropError.message);
      }
    } else {
      console.log('\n✅ No problematic email index found on hospitals collection');
    }
    
    console.log('\n✅ Hospital index checking completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking hospital indexes:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});