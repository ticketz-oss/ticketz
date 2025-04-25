import axios from 'axios';
import { logger } from "../../utils/logger";
import url from 'url';

interface Request {
  webhookUrl: string;
}

const TestWebhookConnectionService = async ({
  webhookUrl
}: Request): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    // First, validate the URL format
    try {
      new URL(webhookUrl);
    } catch (e) {
      logger.error(`Invalid webhook URL format: ${webhookUrl}`);
      return {
        success: false,
        message: 'Invalid webhook URL format',
        details: { error: 'URL validation failed', url: webhookUrl }
      };
    }
    
    logger.info(`Testing webhook connection to: ${webhookUrl}`);
      // Send a test payload to the webhook
    logger.info(`Attempting to connect to webhook URL: ${webhookUrl}`);
    
    const response = await axios.post(webhookUrl, {
      action: 'test',
      timestamp: new Date().toISOString(),
      message: 'Connection test from Ticketz'
    }, {
      timeout: 15000, // 15 second timeout
      maxRedirects: 5,
      validateStatus: function (status) {
        // Consider any status code that's not a server error (5xx) as success
        // This will accept 200-299, 300-399, and 400-499 status codes
        return status < 500;
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Ticketz-Integration/1.0'
      }
    });
    
    logger.info(`Webhook test sent to ${webhookUrl}, status: ${response.status}`);
    
    if (response.status >= 200 && response.status < 300) {
      return { 
        success: true, 
        message: `Connection successful! Status code: ${response.status}`
      };
    } else {
      return { 
        success: false, 
        message: `Webhook responded with status code: ${response.status}`
      };
    }  } catch (error) {
    logger.error(`Error testing webhook connection to ${webhookUrl}: ${error}`);
      let errorMessage = 'Connection failed';
    let details = {};
    
    // Safely check for axios error response
    if (error && typeof error === 'object') {
      if (error.response && typeof error.response === 'object') {
        errorMessage = `Status: ${error.response.status || 'unknown'} - ${error.response.statusText || 'No response text'}`;
        details = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
      } else if (error.code) {
        // Network-level errors often have a code (ECONNREFUSED, ETIMEDOUT, etc.)
        errorMessage = `Network error: ${error.code}`;
        details = {
          code: error.code,
          errno: error.errno,
          syscall: error.syscall,
          address: error.address,
          port: error.port
        };
      } else if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
        details = { rawError: String(error) };
      } else if (error.toString) {
        errorMessage = error.toString();
        details = { rawError: String(error) };
      }
    }
    
    logger.error(`Webhook connection error details: ${JSON.stringify(details)}`);
      
    return { 
      success: false, 
      message: `Connection failed: ${errorMessage}`,
      details
    };
  }
};

export default TestWebhookConnectionService;
