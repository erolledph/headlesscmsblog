const admin = require('firebase-admin');

let db;
let isInitialized = false;

// Initialize Firebase Admin only once
const initializeFirebase = () => {
  if (!isInitialized) {
    try {
      // Delete any existing apps first
      admin.apps.forEach(app => {
        if (app) {
          app.delete();
        }
      });

      // Get credentials from environment variables
      const privateKey = process.env.FIREBASE_PRIVATE_KEY 
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : null;
      
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const projectId = process.env.FIREBASE_PROJECT_ID;

      if (!privateKey || !clientEmail || !projectId) {
        throw new Error('Missing required Firebase environment variables: FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, or FIREBASE_PROJECT_ID');
      }

      // Create service account object from environment variables
      const serviceAccount = {
        type: "service_account",
        project_id: projectId,
        private_key: privateKey,
        client_email: clientEmail,
      };

      // Initialize with explicit configuration
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId,
        databaseURL: `https://${projectId}-default-rtdb.firebaseio.com/`
      });
      
      db = admin.firestore();
      
      // Configure Firestore settings
      db.settings({
        ignoreUndefinedProperties: true
      });
      
      isInitialized = true;
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
      throw new Error(`Firebase initialization failed: ${error.message}`);
    }
  } else if (!db) {
    db = admin.firestore();
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
    console.log('Starting content-by-slug fetch...');
    
    // Initialize Firebase if not already done
    initializeFirebase();

    // Extract slug from path
    const pathParts = event.path.split('/');
    const slug = pathParts[pathParts.length - 1];
    
    if (!slug || slug === 'content-by-slug') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Slug parameter is required' })
      };
    }

    console.log(`Fetching content for slug: ${slug}`);

    // Get specific content by slug
    const contentRef = db.collection('content');
    const query = contentRef
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Content not found' })
      };
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    // Safely handle timestamp conversion
    const publishDate = data.publishDate ? 
      (data.publishDate.toDate ? data.publishDate.toDate().toISOString() : data.publishDate) : 
      null;
    
    const createdAt = data.createdAt ? 
      (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : 
      null;
    
    const updatedAt = data.updatedAt ? 
      (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : 
      null;

    const content = {
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
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(content, null, 2)
    };

  } catch (error) {
    console.error('Error in content-by-slug function:', error);
    
    // Provide more specific error information
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error.code === 'permission-denied') {
      errorMessage = 'Permission denied accessing Firestore';
      statusCode = 403;
    } else if (error.code === 'unauthenticated') {
      errorMessage = 'Firebase authentication failed';
      statusCode = 401;
    } else if (error.message.includes('Firebase')) {
      errorMessage = `Firebase error: ${error.message}`;
    } else if (error.message.includes('Missing required Firebase environment variables')) {
      errorMessage = 'Firebase configuration error: Missing environment variables';
      statusCode = 500;
    }
    
    return {
      statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        message: error.message,
        code: error.code || 'unknown',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};