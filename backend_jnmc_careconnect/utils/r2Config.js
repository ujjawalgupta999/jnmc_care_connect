const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
require("dotenv").config();

// Cloudflare R2 S3-compatible client
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME || "jnmc";

// Public dev URL for unrestricted public access (no signing needed)
const R2_PUBLIC_URL = process.env.R2_PUBLIC_DEV_URL;

/**
 * Upload a file buffer to R2
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} key - Object key (path in bucket)
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - The object key
 */
async function uploadToR2(fileBuffer, key, contentType = "application/pdf") {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });
  await s3.send(command);
  return key;
}

/**
 * Generate a signed URL for temporary access (5 min default)
 * @param {string} pdfKey - Object key in R2
 * @param {number} expiresIn - Expiry in seconds (default 300 = 5 min)
 * @returns {Promise<string>} - Signed URL
 */
async function getSignedPdfUrl(pdfKey, expiresIn = 300) {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: pdfKey,
    ResponseContentType: "application/pdf",
  });
  return await getSignedUrl(s3, command, { expiresIn });
}

/**
 * Get public URL for unrestricted access via R2 public dev domain
 * @param {string} pdfKey - Object key in R2
 * @returns {string} - Public URL
 */
function getPublicPdfUrl(pdfKey) {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${pdfKey}`;
  }
  // Fallback to signed URL if no public URL configured
  return null;
}

module.exports = {
  uploadToR2,
  getSignedPdfUrl,
  getPublicPdfUrl,
  R2_BUCKET,
  R2_PUBLIC_URL,
};
