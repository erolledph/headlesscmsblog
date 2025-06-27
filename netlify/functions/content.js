const admin = require('firebase-admin');

// Initialize Firebase Admin with proper error handling
const initializeFirebase = () => {
  // Only initialize if not already done
  if (admin.apps.length === 0) {
    try {
      // Get environment variables
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Missing Firebase environment variables');
      }

      // Clean and format the private key
      const formattedPrivateKey = privateKey
        .replace(/\\n/g, '\n')
        .replace(/"/g, '')
        .trim();

      // Initialize Firebase Admin
      admin.initializeApp({
        credential: admin.credential.cert({
          type: "service_account",
          project_id: projectId,
          private_key: formattedPrivateKey,
          client_email: clientEmail,
        }),
        projectId: projectId
      });

      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw error;
    }
  }
};

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
    initializeFirebase();

    console.log('Getting Firestore instance...');
    const db = admin.firestore();

    console.log('Querying content collection...');
    const snapshot = await db.collection('content')
      .where('status', '==', 'published')
      .orderBy('publishDate', 'desc')
      .get();

    console.log(`Found ${snapshot.size} documents`);

    if (snapshot.empty) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([])
      };
    }

    const content = [];
    snapshot.forEach(doc => {
      try {
        const data = doc.data();
        
        // Handle Firestore timestamps safely
        const publishDate = data.publishDate && data.publishDate.toDate 
          ? data.publishDate.toDate().toISOString() 
          : data.publishDate || null;
        
        const createdAt = data.createdAt && data.createdAt.toDate 
          ? data.createdAt.toDate().toISOString() 
          : data.createdAt || null;
        
        const updatedAt = data.updatedAt && data.updatedAt.toDate 
          ? data.updatedAt.toDate().toISOString() 
          : data.updatedAt || null;

        content.push({
          id: doc.id,
          title: data.title || '',
          slug: data.slug || '',
          content: data.content || '',
          featuredImageUrl: data.featuredImageUrl || '',
          metaDescription: data.metaDescription || '',
          seoTitle: data.seoTitle || data.title || '',
          keywords: Array.isArray(data.keywords) ? data.keywords : [],
          author: data.author || '',
          categories: Array.isArray(data.categories) ? data.categories : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          status: data.status || 'draft',
          publishDate,
          createdAt,
          updatedAt
        });
      } catch (docError) {
        console.error(`Error processing document ${doc.id}:`, docError);
      }
    });

    console.log(`Successfully processed ${content.length} content items`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(content, null, 2)
    };

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        code: error.code || 'unknown'
      })
    };
  }
};