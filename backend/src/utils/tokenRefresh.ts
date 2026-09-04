import axios from 'axios';
import EmailConnection from '../models/EmailConnection';

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

/**
 * Refresh expired Google OAuth token using refresh_token
 */
export const refreshGoogleToken = async (connectionId: string): Promise<boolean> => {
  try {
    const connection = await EmailConnection.findById(connectionId);

    if (!connection || !connection.google_tokens) {
      console.log(`❌ [TOKEN REFRESH] Connection or tokens not found: ${connectionId}`);
      return false;
    }

    // Check if access token is currently valid (expires in > 2 minutes)
    const expiresAt = connection.google_tokens.expires_at || 0;
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    if (connection.google_tokens.access_token && timeUntilExpiry > 2 * 60 * 1000) {
      console.log(`✅ [TOKEN REFRESH] Access token is valid for ${Math.round(timeUntilExpiry / 1000)}s`);
      return true;
    }

    const { refresh_token } = connection.google_tokens;

    if (!refresh_token) {
      console.log(`⚠️ [TOKEN REFRESH] No refresh token, but checking if access token exists`);
      if (connection.google_tokens.access_token && timeUntilExpiry > 0) {
        return true;
      }
      console.log(`❌ [TOKEN REFRESH] No refresh token and access token expired for: ${connectionId}`);
      return false;
    }

    console.log(`🔄 [TOKEN REFRESH] Refreshing token for ${connection.email}`);

    // Request new access token
    const response = await axios.post(GOOGLE_TOKEN_ENDPOINT, {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refresh_token,
      grant_type: 'refresh_token',
    });

    const { access_token, expires_in } = response.data;

    if (!access_token) {
      console.error(`❌ [TOKEN REFRESH] No access token in response`);
      return false;
    }

    // Update connection with new token
    connection.google_tokens.access_token = access_token;
    connection.google_tokens.expires_at = Date.now() + (expires_in * 1000);

    await connection.save();

    console.log(`✅ [TOKEN REFRESH] Token refreshed for ${connection.email}, valid for ${expires_in}s`);
    return true;
  } catch (error) {
    console.error(`❌ [TOKEN REFRESH] Error refreshing token:`, error);
    return false;
  }
};

/**
 * Ensure token is fresh before using it (refresh if needed)
 */
export const ensureTokenFresh = async (connectionId: string): Promise<boolean> => {
  return await refreshGoogleToken(connectionId);
};
