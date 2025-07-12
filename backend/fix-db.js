const mongoose = require('mongoose');
require('dotenv').config();

async function fixDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/migrantconnect', { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    
    console.log('Connected to MongoDB');
    
    // Drop the existing aadhaar index
    const db = mongoose.connection.db;
    await db.collection('users').dropIndex('aadhaar_1');
    console.log('Dropped existing aadhaar index');
    
    // Create new sparse unique index
    await db.collection('users').createIndex({ aadhaar: 1 }, { 
      unique: true, 
      sparse: true 
    });
    console.log('Created new sparse unique index on aadhaar');
    
    console.log('Database fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing database:', error);
    process.exit(1);
  }
}

fixDatabase(); 