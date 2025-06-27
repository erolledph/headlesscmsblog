# Content Management System

A modern, responsive admin panel for managing blog content with Firebase backend and public API endpoint.

## Features

- **Authentication**: Secure login with Firebase Auth
- **Content Management**: Create, edit, delete, and manage blog posts
- **Markdown Support**: Write content in Markdown format
- **Public API**: Serve content via `/api/content.json` endpoint
- **Responsive Design**: Works on all devices
- **Real-time Updates**: Content updates in real-time
- **SEO Optimized**: Full SEO metadata support

## Setup Instructions

### 1. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication with Email/Password
3. Create a Firestore database
4. Update `firebase-config.js` with your Firebase configuration

### 2. Authentication Setup

Create an admin user in Firebase Authentication:
1. Go to Firebase Console > Authentication > Users
2. Add a new user with email and password
3. Use these credentials to log into the admin panel

### 3. Firestore Rules

Set up Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write content
    match /content/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Allow public read access to API data
    match /api/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 4. API Server Setup

To serve the `/api/content.json` endpoint, you have several options:

#### Option A: Node.js Server (Recommended)

1. Install dependencies:
```bash
npm install firebase-admin express cors
```

2. Use the provided `api-server.js` file
3. Deploy to your hosting provider (Vercel, Netlify, etc.)

#### Option B: Firebase Functions

Create a Firebase Function to serve the API:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.contentApi = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  try {
    const snapshot = await admin.firestore()
      .collection('content')
      .where('status', '==', 'published')
      .orderBy('publishDate', 'desc')
      .get();

    const content = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      content.push({
        id: doc.id,
        ...data,
        publishDate: data.publishDate?.toDate?.()?.toISOString() || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
      });
    });

    res.json(content);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Usage

### Admin Panel

1. Navigate to your admin panel URL
2. Log in with your Firebase credentials
3. Use the sidebar navigation to:
   - **Overview**: View content statistics
   - **Manage Content**: List, edit, delete existing content
   - **Create Content**: Add new blog posts
   - **Documentation**: API usage examples

### Content Creation

1. Click "Create Content" in the sidebar
2. Fill in all required fields:
   - Title (required)
   - Slug (auto-generated from title)
   - Content in Markdown format (required)
   - Author (required)
   - SEO metadata (optional but recommended)
   - Categories and tags
   - Status (draft or published)

### API Usage

Access your content via the public API:

```javascript
// Fetch all published content
fetch('https://yourdomain.com/api/content.json')
  .then(response => response.json())
  .then(data => console.log(data));

// Find specific content by slug
fetch('https://yourdomain.com/api/content.json')
  .then(response => response.json())
  .then(data => {
    const post = data.find(item => item.slug === 'your-slug');
    console.log(post);
  });
```

## Content Structure

Each content item has the following structure:

```json
{
  "id": "firestore-generated-id",
  "title": "Post Title",
  "slug": "post-title",
  "content": "# Markdown Content\n\nYour post content...",
  "featuredImageUrl": "https://example.com/image.jpg",
  "metaDescription": "SEO meta description",
  "seoTitle": "SEO optimized title",
  "keywords": ["keyword1", "keyword2"],
  "author": "Author Name",
  "categories": ["Category 1", "Category 2"],
  "tags": ["tag1", "tag2"],
  "status": "published",
  "publishDate": "2025-01-27T10:00:00Z",
  "createdAt": "2025-01-27T09:30:00Z",
  "updatedAt": "2025-01-27T10:15:00Z"
}
```

## Deployment

1. Deploy the admin panel to any static hosting service
2. Deploy the API server to a Node.js hosting service
3. Update your domain configuration to point `/api/content.json` to your API server

## Security

- Admin panel requires Firebase authentication
- Firestore rules protect content from unauthorized access
- API endpoint serves only published content
- All sensitive operations require authentication

## Support

For issues or questions, refer to the documentation tab in the admin panel or check the Firebase documentation.