const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account
const serviceAccount = {
  "type": "service_account",
  "project_id": "ectawks",
  "private_key_id": "5a258e47c6751edb777a54019dc0de61c300183a",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDJN6V7ClN2r6KC\nIIl0P1PUk8VwzXlDGdoV9MosVFbVT/Qw5YsJCQjAf4QSYEYgALcJ6xi08bYVNEgW\nfNSBrM/tSEgftLAxbHnPZilMwosSGedtYdfoo7kRdsE7+311Pt1j/QnYpaV6wdIv\nngRsSOam+HMzMfpT1I66exD78VNjw2DFdno/Loof4QRBGbmGaHzIskJLdLembSPo\n1rh27RUctGp3YME47cEHvXXAhYhQeBAlkLljxfAIRQojomW334GPNOn3s8PrFCCR\n0xuJlSBPydg13u7mnUEePsiV5lbJcx3CFG0/UlIXkF7jGJ4lRJTQdX0IaYXBHgJg\ntWpFz6pNAgMBAAECggEAIZgkjPMXpb5jmamwgUPMbXahdXicuQcBKf7FXVrUZ4dS\ni/JbAO5s82SmyoGf25p69NE3PgiH/6jLq1N6kE7npSRXBFIgw5Oqj6WtGgd1/Bbu\nlEzMZScmkCOdVfQiSVeuU1INGYpoYyMmgjQ15VVTiwd6hk7fDi10Ce7fkkzDgSly\nj+7OcdReL6UnKPHgphUFYM/ie3WCKNkhAA5MaUWlLbzXTeyBXd072p4CnhjsRZXd\naCazWl2cWLBX8+61URDOWLuGNuR7NFOrVClD036W9Z5CMf04TDtfBjjdgB333OxE\nMZdVVfpl5JW4jsYN5sO6JZzXwZVZAt0j7XLzMsS3UQKBgQD8ivtgkKZ15wcA16YD\npcCzmNjqqCfwYjRznBaAyZizDPST2BLIKOu6VW9uHJaXzoxsi9aOX5EmfnnL6US6\n8N+LqpLHjZqZivE205rCpJ5FKsQUm2Xifkn2LsP4xZw4ysKlJMkI5R7PRwdFU+3F\n0iOSlmpUlk3VPH0RONdJvyZL0QKBgQDL+MxEHTywWPGgBVHFful8ClsI3XhRFPEa\nugqLIZSMqGZx2kk78GER4LKYQJufDszO77+Mlatxsck3SNC80MnYn35VPtzUR8uO\n4WCPe/3Pz1hG0UyJGFiNC9nI//F9wQNH4HKxtjtyCiQm2sDdrNKe0Xd+RylGX9V9\nZ5pa9DfhvQKBgQCiMfTu+RggAygJT3ctQoh4EIPIegVkqv36/lWpk1CCNqDiT1UI\nvtdfDj4J30yM5ThlAo7jU9eafIJnB0OAOPGp9vxcM8MGOClhyBfOSQHpdGUIwyF1\njRydgz2UCf6irv7CJ9UB5H2cLIcr7JJ6idMU84wJFZuZh0bgB7ylfaHv8QKBgESK\nF+mTgX8ohBjncLDSkpaRzEFQWku0o8f9V+mkoQwa0kHTveQcRCIDxT+QBjsOeBfZ\nTB5rdK7BtQGUwD+SUSEvhv4SH5ZdgbNDXHUajxEzdVBmqDcxLSBIKSh3iKhfIUEX\n1LKOr68EZV2BCGn01tlzPZn7Q41YSp7XH3EMu3JpAoGBAKtxY/4uFOfY2GLUzYKG\nQnRHui4jtawYVfGz8CwejxmwmDrFFFy/VF62NYupSA3s/UORlxj5ePpbdo/6pyKT\n+MEoKMlpaC3A8FC6MqdSpSDvNlBS1m3HKzdmksJzzODeXpC6sRBePnAzI6IBng3z\nSDdZt6pG3tGf7Q1wqwzNJEP4\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-aq4h4@ectawks.iam.gserviceaccount.com",
  "client_id": "114614377406655977447",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-aq4h4%40ectawks.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

let db;

// Initialize Firebase Admin only once
const initializeFirebase = () => {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'ectawks'
      });
      db = admin.firestore();
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
      throw error;
    }
  } else {
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
    // Initialize Firebase if not already done
    if (!db) {
      initializeFirebase();
    }

    // Extract slug from path
    const slug = event.path.split('/').pop();
    
    if (!slug) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Slug parameter is required' })
      };
    }

    console.log(`Fetching content for slug: ${slug}`);

    // Get specific content by slug
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
      publishDate: data.publishDate?.toDate?.()?.toISOString() || null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(content, null, 2)
    };

  } catch (error) {
    console.error('Error fetching content:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};