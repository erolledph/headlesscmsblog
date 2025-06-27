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
        throw new Error('Missing Firebase environment variables. Please check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY');
      }

      // Clean and format the private key properly
      let formattedPrivateKey = privateKey;
      
      // Handle different private key formats
      if (privateKey.includes('\\n')) {
        formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
      }
      
      // Remove quotes if present
      formattedPrivateKey = formattedPrivateKey.replace(/^"(.*)"$/, '$1');
      
      // Ensure proper BEGIN/END format
      if (!formattedPrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        throw new Error('Invalid private key format. Must include BEGIN/END markers');
      }

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

    console.log(`Querying content for slug: ${slug}`);
    const db = admin.firestore();

    const snapshot = await db.collection('content')
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Content not found' })
      };
    }

    const doc = snapshot.docs[0];
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
    console.error('Function error:', error);
    
    // Provide more detailed error information
    let errorMessage = error.message;
    let errorCode = error.code || 'unknown';
    
    // Handle specific Firebase errors
    if (error.message.includes('DECODER routines')) {
      errorMessage = 'Firebase private key format error. Please check your FIREBASE_PRIVATE_KEY environment variable.';
      errorCode = 'INVALID_PRIVATE_KEY';
    } else if (error.message.includes('Missing Firebase environment variables')) {
      errorMessage = 'Missing Firebase configuration. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.';
      errorCode = 'MISSING_CONFIG';
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: errorMessage,
        code: errorCode,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};