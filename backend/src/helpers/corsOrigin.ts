/**
 * Determines allowed CORS origins based on environment variables.
 *
 * Environment variables:
 * - `FRONTEND_CUSTOM_URL`: Comma-separated list of additional allowed origins for CORS.
 *   Each URL is trimmed and added to the set of allowed origins.
 *   Example: `https://app.example.com,https://admin.example.com`
 * - `FRONTEND_URL_REGEX`: Regular expression pattern to match allowed origins dynamically.
 *   If the incoming origin matches this regex, it is allowed by CORS.
 *   Example: `^https:\/\/.*\.example\.com$`
 *
 * Both variables are used to determine if a request's origin is permitted by the CORS policy,
 * in addition to `FRONTEND_URL`.
 *
 * @param {string} origin - The request's origin header.
 * @param {(err: Error, allow?: boolean) => void} callback - Callback to indicate if the origin is allowed.
 */
export const corsOrigin =
  process.env.FRONTEND_CUSTOM_URL || process.env.FRONTEND_URL_REGEX
    ? (origin: string, callback: (arg0: Error, arg1?: boolean) => void) => {
        const allowedOrigins = [process.env.FRONTEND_URL];

        if (process.env.FRONTEND_CUSTOM_URL) {
          const customUrls = process.env.FRONTEND_CUSTOM_URL.split(",");
          customUrls.forEach(url => allowedOrigins.push(url.trim()));
        }

        if (process.env.FRONTEND_URL_REGEX) {
          const regex = new RegExp(process.env.FRONTEND_URL_REGEX);
          if (regex.test(origin)) {
            allowedOrigins.push(origin);
          }
        }

        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} is not allowed by CORS`));
        }
      }
    : process.env.FRONTEND_URL;
