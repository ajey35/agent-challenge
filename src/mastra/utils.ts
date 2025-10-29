
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

// Include scopes required for reading and updating / composing drafts
const SCOPES = ["https://mail.google.com/"];

/**
 * Initialize OAuth2 client using environment variables
 */
export function getOAuth2Client() {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_REFRESH_TOKEN,
  } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error("Missing Google OAuth credentials in .env file");
  }

  const oAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  if (GOOGLE_REFRESH_TOKEN) {
    oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  }

  return oAuth2Client;
}
  
  /**
   * Send a message for the authenticated user.
   * Accepts the same inputs as createDraft: either `raw` or `to`/`subject`/`body`.
   */

/**
 * Generate the authorization URL (only needed once to get refresh token)
 */
export function generateAuthUrl() {
  const oAuth2Client = getOAuth2Client();
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
  console.log("Authorize this app by visiting:", authUrl);
  return authUrl;
}

/**
 * Exchange authorization code for a refresh token (run this once)
 */
export async function getRefreshToken(code: string) {
  const oAuth2Client = getOAuth2Client();
  const { tokens } = await oAuth2Client.getToken(code);
  console.log("Tokens:", tokens);
  console.log("Store this refresh token in .env → GOOGLE_REFRESH_TOKEN");
  return tokens;
}

/**
 * Fetch unread Gmail messages
 */

/**
 * Create a draft for the authenticated user.
 * Accepts either a raw RFC2822 message encoded in base64url (preferred),
 * or a minimal object with `to`, `subject`, and `body` to construct a plain text message.
 */