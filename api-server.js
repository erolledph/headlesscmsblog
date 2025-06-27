// Node.js server to serve the API endpoint
// This file shows how to implement the server-side API endpoint

const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin (you'll need to add your service account key)
const serviceAccount = {
  "type": "service_account",
  "project_id": "ectawks",
  "private_key_id": "7a2731987ff84010446395db538ed7e1e2903429",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDfOjoxncHmmDhM\nhCo06kfNk1IJtU6Upce9p1EpDGZZtDp/T4SR+WacaDvyZ55RH2KmLL7ZbOJhNL3t\nu1vNXAOfAfOT0sXcK1nHmuelTUsLA/eI+YAvY7rm1gFZjY6iVv4z2+DsBLD4FWOW\nD4sOFZgYnih9oiPf5wsX3hHqopQXA8+kprG0kj8PD+ZX7GJQsCzWGCBEmQA01vi0\nD73Tqv2bW4R3kbCC3kYHXe8eIzeeU3F1oJymDvFqCywuRHWAV1s9RkxSljQqG5R3\niGB3kB1VkSKxb/I+B6IyAioDCb0IYfExzGW6jYMnW3jpKSGEFCvsYbSj8wxx4w+n\nDFxw3t8BAgMBAAECggEABirq8DOCZ79lcNHHA8LEXJz5K4z/oJJLCEWu86Ik0s4s\nvpdBG7JnICOuIla0FFw4YsyCMmo0gAiPxdmDIhOsgvBwHTG550koWCBCzbmqvOFt\nbbKtFMId6CJaE7IaUohyShcFaigABr66i2sfBbLZiraV+lCoSpes4gov9wpqao9S\na1cirRiiO6tSaDCROx468dS3iAHJh14rgmf6+LREqNEn4usuPNCgHGcFWdLssvBD\nV7Dk6P7V3WHatBL3uE7eX1lQCG4Ah4jnRh43bnI6qNV7lqn8ta4eocf4MMLBLPwK\nYdDx3L5KjSgLrM2gOQMim4tefSsR9dPng6oQWmIZ0QKBgQD7xHaIEB6qG1Arb7oj\nBO1nHrz/2YPJRY4I8lK28lPRT/13BY/Y/PyZfsMCulpLysl5r/LvKV1tmWEFfl3c\n+duarIUZEsRQEUeNFN3oZk6J9Vmfr6UKxVrEgsNiiHDwg5AD4Q8POmGHrAKYQ0zv\nIYyDJqd9Dfamet6L3zicUouBeQKBgQDi+u+oG4S/f9i+Q1px9CW6XKyvkSytooYi\nm1IFZ6+x4muhollVLFaIg382fmVIKlmu0+OHQo1poSF2QfSM9sutBkjDUH9eEMd5\nJ/7USyCwvPnYu2AuhoTh8J4/pyN/5L/rkYPgvdyOl8knyEdJcf7b9gvtyAZ9GDmo\n6vvdLdkvyQKBgElKSc8WEjcmuFHMtnzXRFzOf+pi4ZBH5S8Ji7aiGHBIPtrVDaj3\nDHmKgy5aHUsO/1OjOq8QdZggHDRDMwPO4HTIX/6KjgdY4GFbf7XVgmt6ttpbgUn/\nZYrrHgGjAm2hft0COSYPsrCSDDdS8CR0ubi8Gem3lOOlxP8mvg4ToXTRAoGBAMOs\ntMJlxtEYNBACHIy0f3njvvMz4iJmQ+C9qb4DHxHpMgSL4xtsN8VEJ30hBctqxxnS\njQnkM+jmAeTjAyIq+HdXPY8zbDn5mR03f5YgljQHFhTjpA035oKpXqNdQVtWJqW8\nMsaipus+qylinSIR5jZWLP52PDHHmp2mxi5tAhkRAoGBAJMPA+Y9pdKBWGCNHDFH\nKXy+eXCumixV26vrRG2d6oKGPp56IeUBx8XKQ3Q13rsJ6MSuE11f28FUAFwezdm0\nb66iWRDnP0UdyUxnLbxDsbvIbLfPmVs4rsaNcQNaNYBv37zIgq27/VkUhbRnFPyO\n86YqxQ/KMzT6q572NNuYaAq/\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-aq4h4@ectawks.iam.gserviceaccount.com",
  "client_id": "114614377406655977447",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-aq4h4%40ectawks.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'ectawks'
});

const db = admin.firestore();
const app = express();

// Enable CORS
app.use(cors());

// API endpoint to serve content
app.get('/api/content.json', async (req, res) => {
  try {
    // Get published content from Firestore
    const snapshot = await db.collection('content')
      .where('status', '==', 'published')
      .orderBy('publishDate', 'desc')
      .get();

    const content = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      content.push({
        id: doc.id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        featuredImageUrl: data.featuredImageUrl || '',
        metaDescription: data.metaDescription || '',
        seoTitle: data.seoTitle || '',
        keywords: data.keywords || [],
        author: data.author,
        categories: data.categories || [],
        tags: data.tags || [],
        status: data.status,
        publishDate: data.publishDate?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
      });
    });

    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to get specific content by slug
app.get('/api/content/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const snapshot = await db.collection('content')
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    const content = {
      id: doc.id,
      title: data.title,
      slug: data.slug,
      content: data.content,
      featuredImageUrl: data.featuredImageUrl || '',
      metaDescription: data.metaDescription || '',
      seoTitle: data.seoTitle || '',
      keywords: data.keywords || [],
      author: data.author,
      categories: data.categories || [],
      tags: data.tags || [],
      status: data.status,
      publishDate: data.publishDate?.toDate?.()?.toISOString() || null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
    };

    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`Content API available at: http://localhost:${PORT}/api/content.json`);
});

module.exports = app;
