const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account
const serviceAccount = {
  "type": "service_account",
  "project_id": "ectawks",
  "private_key_id": "5a258e47c6751edb777a54019dc0de61c300183a",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDJN6V7ClN2r6KC\nIIl0P1PUk8VwzXlDGdoV9MosVFbVT/Qw5YsJCQjAf4QSYEYgALcJ6xi08bYVNEgW\nfNSBrM/tSEgftLAxbHnPZilMwosSGedtYdfoo7kRdsE7+311Pt1j/QnYpaV6wdIv\nngRsSOam+HMzMfpT1I66exD78VNjw2DFdno/Loof4QRBGbmGaHzIskJLdLembSPo\n1rh27RUctGp3YME47cEHvXXAhYhQeBAlkLljxfAIRQojomW334GPNOn3s8PrFCCR\n0xuJlSBPydg13u7mnUEePsiV5lbJcx3CFG0/UlIXkF7jGJ4lRJTQdX0IaYXBHgJg\ntWpFz6pNAgMBAAECggEAIZgkjPMXpb5jmamwgUPMbXahdXicuQcBKf7FXVrUZ4dS\ni/JbAO5s82SmyoGf25p69NE3PgiH/6jLq1N6kE7npSRXBFIgw5Oqj6WtGgd1/Bbu\nlEzMZScmkCOdVfQiSVeuU1INGYpoYyMmgjQ15VVTiwd6hk7fDi10Ce7fkkzDgSly\nj+7OcdReL6UnKPHgphUFYM/ie3WCKNkhAA5MaUWlLbzXTeyBXd072p4CnhjsRZXd\aCazWl2cWLBX8+61URDOWLuGNuR7NFOrVClD036W9Z5CMf04TDtfBjjdgB333OxE\nMZdVVfpl5JW4jsYN5sO6JZzXwZVZAt0j7XLzMsS3UQKBgQD8ivtgkKZ15wcA16YD\npcCzmNjqqCfwYjRznBaAyZizDPST2BLIKOu6VW9uHJaXzoxsi9aOX5EmfnnL6US6\n8N+LqpLHjZqZivE205rCpJ5FKsQUm2Xifkn2LsP4xZw4ysKlJMkI5R7PRwdFU+3F\n0iOSlmpUlk3VPH0RONdJvyZL0QKBgQDL+MxEHTywWPGgBVHFful8ClsI3XhRFPEa\nugqLIZSMqGZx2kk78GER4LKYQJufDszO77+Mlatxsck3SNC80MnYn35VPtzUR8uO\n4WCPe/3Pz1hG0UyJGFiNC9nI//F9wQNH4HKxtjtyCiQm2sDdrNKe0Xd+RylGX9V9\nZ5pa9DfhvQKBgQCiMfTu+RggAygJT3ctQoh4EIPIegVkqv36/lWpk1CCNqDiT1UI\nvtdfDj4J30yM5ThlAo7jU9eafIJnB0OAOPGp9vxcM8MGOClhyBfOSQHpdGUIwyF1\njRydgz2UCf6irv7CJ9UB5H2cLIcr7JJ6idMU84wJFZuZh0bgB7ylfaHv8QKBgESK\nF+mTgX8ohBjncLDSkpaRzEFQWku0o8f9V+mkoQwa0kHTveQcRCIDxT+QBjsOeBfZ\nTB5rdK7BtQGUwD+SUSEvhv4SH5ZdgbNDXHUajxEzdVBmqDcxLSBIKSh3iKhfIUEX\n1LKOr68EZV2BCGn01tlzPZn7Q41YSp7XH3EMu3JpAoGBAKtxY/4uFOfY2GLUzYKG\nQnRHui4jtawYVfGz8CwejxmwmDrFFFy/VF62NYupSA3s/UORlxj5ePpbdo/6pyKT\n+MEoKMlpaC3A8FC6MqdSpSDvNlBS1m3HKzdmksJzzODeXpC6sRBePnAzI6IBng3z\nSDdZt6pG3tGf7Q1wqwzNJEP4\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-aq4h4@ectawks.iam.gserviceaccount.com",
  "client_id": "114614377406655977447",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-aq4h4%40ectawks.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Global variables to store initialized services
let db = null;
let isInitialized = false;

// Initialize Firebase Admin only once
function initializeFirebase() {
  if (isInitialized) {
    return db;
  }

  try {
    // Check if any Firebase apps are already initialized
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
        databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`
      });
      console.log('Firebase Admin initialized successfully');
    }
    
    db = admin.firestore();
    
    // Configure Firestore settings
    db.settings({
      ignoreUndefinedProperties: true
    });
    
    isInitialized = true;
    return db;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Initializing Firebase...');
    const firestore = initializeFirebase();
    
    if (!firestore) {
      throw new Error('Failed to initialize Firestore');
    }

    console.log('Attempting to fetch content from Firestore...');
    
    // Get published content from Firestore with error handling
    const contentRef = firestore.collection('content');
    const query = contentRef.where('status', '==', 'published');
    
    console.log('Executing Firestore query...');
    const snapshot = await query.get();

    console.log(`Query executed successfully. Found ${snapshot.size} documents`);

    const content = [];
    
    if (!snapshot.empty) {
      snapshot.forEach(doc => {
        try {
          const data = doc.data();
          console.log(`Processing document ${doc.id}:`, Object.keys(data));
          
          // Safely convert Firestore timestamps
          const publishDate = data.publishDate && data.publishDate.toDate ? 
            data.publishDate.toDate().toISOString() : 
            (data.publishDate || null);
            
          const createdAt = data.createdAt && data.createdAt.toDate ? 
            data.createdAt.toDate().toISOString() : 
            (data.createdAt || new Date().toISOString());
            
          const updatedAt = data.updatedAt && data.updatedAt.toDate ? 
            data.updatedAt.toDate().toISOString() : 
            (data.updatedAt || createdAt);

          content.push({
            id: doc.id,
            title: data.title || '',
            slug: data.slug || '',
            content: data.content || '',
            featuredImageUrl: data.featuredImageUrl || '',
            metaDescription: data.metaDescription || '',
            seoTitle: data.seoTitle || data.title || '',
            keywords: Array.isArray(data.keywords) ? data.keywords : 
                     (typeof data.keywords === 'string' ? data.keywords.split(',').map(k => k.trim()) : []),
            author: data.author || '',
            categories: Array.isArray(data.categories) ? data.categories : 
                       (typeof data.categories === 'string' ? data.categories.split(',').map(c => c.trim()) : []),
            tags: Array.isArray(data.tags) ? data.tags : 
                 (typeof data.tags === 'string' ? data.tags.split(',').map(t => t.trim()) : []),
            status: data.status || 'draft',
            publishDate,
            createdAt,
            updatedAt
          });
        } catch (docError) {
          console.error(`Error processing document ${doc.id}:`, docError);
          // Continue processing other documents
        }
      });
    }

    // Sort by publishDate or createdAt in descending order (newest first)
    content.sort((a, b) => {
      const dateA = new Date(a.publishDate || a.createdAt || 0);
      const dateB = new Date(b.publishDate || b.createdAt || 0);
      return dateB - dateA;
    });

    console.log(`Successfully processed ${content.length} content items`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(content, null, 2)
    };

  } catch (error) {
    console.error('Detailed error in Netlify function:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name
    });
    
    // Provide more specific error messages
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error.code === 16 || error.message.includes('UNAUTHENTICATED')) {
      errorMessage = 'Firebase authentication failed. Please check service account credentials.';
      statusCode = 401;
    } else if (error.code === 7 || error.message.includes('PERMISSION_DENIED')) {
      errorMessage = 'Permission denied. Please check Firestore security rules.';
      statusCode = 403;
    } else if (error.message.includes('not found')) {
      errorMessage = 'Firestore collection not found.';
      statusCode = 404;
    }
    
    return {
      statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      })
    };
  }
};
