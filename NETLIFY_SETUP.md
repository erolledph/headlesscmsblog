# Netlify Environment Variables Setup

To fix the API endpoints, you need to set up the following environment variables in your Netlify dashboard:

## Required Environment Variables

1. **FIREBASE_PROJECT_ID**
   - Value: `ectawks`

2. **FIREBASE_CLIENT_EMAIL**
   - Value: `firebase-adminsdk-aq4h4@ectawks.iam.gserviceaccount.com`

3. **FIREBASE_PRIVATE_KEY**
   - Value: Copy the entire private key from your Firebase service account JSON, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines
   - **Important**: Make sure to include the newlines properly. The key should look like:
   ```
   -----BEGIN PRIVATE KEY-----
   MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDJN6V7ClN2r6KC
   IIl0P1PUk8VwzXlDGdoV9MosVFbVT/Qw5YsJCQjAf4QSYEYgALcJ6xi08bYVNEgW
   ...
   -----END PRIVATE KEY-----
   ```

## How to Set Environment Variables in Netlify

1. Go to your Netlify dashboard
2. Select your site (`nextjsblog123`)
3. Go to **Site settings** → **Environment variables**
4. Click **Add variable** for each of the three variables above
5. After adding all variables, redeploy your site

## Alternative: Using Netlify CLI

If you have Netlify CLI installed, you can set the variables using:

```bash
netlify env:set FIREBASE_PROJECT_ID "ectawks"
netlify env:set FIREBASE_CLIENT_EMAIL "firebase-adminsdk-aq4h4@ectawks.iam.gserviceaccount.com"
netlify env:set FIREBASE_PRIVATE_KEY "-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDJN6V7ClN2r6KC
...
-----END PRIVATE KEY-----"
```

## Testing the API

After setting up the environment variables and redeploying, test your API:

```bash
curl -X GET https://nextjsblog123.netlify.app/api/content.json
```

The API should now return your published content instead of the decoder error.

## Troubleshooting

If you still get errors:

1. **Check the private key format**: Make sure there are no extra quotes or escaped characters
2. **Verify all three environment variables are set**: Missing any one will cause authentication to fail
3. **Redeploy after setting variables**: Environment variables only take effect after a new deployment
4. **Check Netlify function logs**: Go to Functions tab in Netlify dashboard to see detailed error logs

## Security Note

Never commit your Firebase private key to version control. Always use environment variables for sensitive credentials.