const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// Initialize Gemini AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not found in environment variables. AI analysis will fail.');
}

let genAI = null;
if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  } catch (error) {
    console.error('❌ Error initializing Gemini AI:', error.message);
  }
}

/**
 * Analyze a medical document using Gemini AI
 * @param {string} filePath - Path to the file on disk
 * @param {string} mimeType - MIME type of the file (e.g., "application/pdf", "image/jpeg")
 * @param {string} originalFileName - Original filename for context
 * @param {string} type - Document type (prescription, report, xray, etc.)
 * @returns {Promise<{summary: string, extractedData?: object}>}
 */
async function analyzeMedicalDocument(filePath, mimeType, originalFileName, type) {
  // Fallback if Gemini is not configured
  if (!genAI || !GEMINI_API_KEY) {
    console.warn('⚠️  Gemini AI not configured. Returning fallback summary.');
    return {
      summary: "AI analysis unavailable. Original document stored successfully.",
      extractedData: null
    };
  }

  try {
    let textContent = '';
    let imageData = null;

    // Handle PDF files
    if (mimeType === 'application/pdf') {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(fileBuffer);
        textContent = pdfData.text;
        
        if (!textContent || textContent.trim().length === 0) {
          // PDF might be image-based, try to extract as image
          console.log('PDF appears to be image-based, attempting image analysis...');
          imageData = {
            inlineData: {
              data: fileBuffer.toString('base64'),
              mimeType: 'application/pdf'
            }
          };
        }
      } catch (pdfError) {
        console.error('Error parsing PDF:', pdfError.message);
        // Try as image
        const fileBuffer = fs.readFileSync(filePath);
        imageData = {
          inlineData: {
            data: fileBuffer.toString('base64'),
            mimeType: 'application/pdf'
          }
        };
      }
    } 
    // Handle image files
    else if (mimeType.startsWith('image/')) {
      const fileBuffer = fs.readFileSync(filePath);
      imageData = {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: mimeType
        }
      };
    }
    // For other file types, try to read as text
    else {
      try {
        textContent = fs.readFileSync(filePath, 'utf-8');
      } catch (error) {
        console.error('Error reading file as text:', error.message);
        return {
          summary: "AI analysis failed. Original document stored successfully.",
          extractedData: null
        };
      }
    }

    // Get the appropriate model
    // Try gemini-1.5-flash first, fallback to gemini-pro if needed
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    } catch (modelError) {
      console.warn('⚠️  gemini-1.5-flash not available, trying gemini-pro');
      model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    }

    // Build the prompt
    const prompt = `You are a medical assistant. Analyze this medical document and provide a clear, doctor-friendly summary.

Document Type: ${type}
File Name: ${originalFileName}

Please provide:
1. A concise summary (3-6 sentences) of the document's key information
2. Key findings or important values
3. Any red-flag values or urgent concerns that need immediate attention
4. Recommendations if applicable

Format your response as a clear, professional medical summary that a doctor can quickly understand.`;

    // Check if we have content to analyze
    if (!imageData && (!textContent || textContent.trim().length === 0)) {
      return {
        summary: "AI analysis failed: Unable to extract content from document. Original document stored successfully.",
        extractedData: null
      };
    }
    
    // Retry logic for rate limits (max 2 retries with exponential backoff)
    const maxRetries = 2;
    let result = null;
    let lastError = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // If we have image data, use multimodal input
        if (imageData) {
          result = await model.generateContent([prompt, imageData]);
        } 
        // If we have text content, use text-only
        else {
          result = await model.generateContent([prompt, textContent]);
        }
        
        // Success - break out of retry loop
        break;
      } catch (retryError) {
        lastError = retryError;
        
        // Check if it's a rate limit error (429) and we have retries left
        if (retryError.message && retryError.message.includes('429') && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s
          console.log(`⚠️  Rate limit hit, retrying in ${waitTime/1000}s... (attempt ${attempt + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue; // Retry
        }
        
        // If not a rate limit or no retries left, throw the error
        throw retryError;
      }
    }
    
    // If we still don't have a result after retries, throw the last error
    if (!result) {
      throw lastError || new Error('Failed to generate content after retries');
    }

    const response = await result.response;
    const summary = response.text();

    // Try to extract structured data (optional)
    let extractedData = null;
    try {
      // You can add logic here to parse structured data from the summary
      // For now, we'll just return the summary
      extractedData = {
        documentType: type,
        analyzedAt: new Date().toISOString(),
        fileName: originalFileName
      };
    } catch (parseError) {
      console.warn('Could not extract structured data:', parseError.message);
    }

    return {
      summary: summary.trim(),
      extractedData: extractedData
    };

  } catch (error) {
    console.error('❌ Error analyzing document with Gemini:', error.message);
    
    // Handle specific error types
    let errorMessage = "AI analysis temporarily unavailable";
    
    if (error.message && error.message.includes('429')) {
      errorMessage = "AI analysis rate limit exceeded. Please try again in a few minutes. Document stored successfully.";
      console.error('⚠️  Gemini API rate limit exceeded. Consider requesting higher quota or waiting before retry.');
    } else if (error.message && error.message.includes('401') || error.message && error.message.includes('403')) {
      errorMessage = "AI analysis authentication failed. Please check API key configuration.";
      console.error('⚠️  Gemini API authentication error. Check GEMINI_API_KEY in .env');
    } else if (error.message && error.message.includes('quota')) {
      errorMessage = "AI analysis quota exceeded. Please request higher quota or try again later. Document stored successfully.";
      console.error('⚠️  Gemini API quota exceeded. Visit: https://cloud.google.com/docs/quotas/help/request_increase');
    } else {
      errorMessage = "AI analysis failed. Original document stored successfully.";
      console.error('Full error:', error);
    }
    
    // Return fallback summary on error
    return {
      summary: errorMessage,
      extractedData: null
    };
  }
}

module.exports = {
  analyzeMedicalDocument
};

