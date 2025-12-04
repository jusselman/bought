import { validationResult } from 'express-validator';

/* Handle Validation Errors */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array()
    });
  }
  
  next();
};

/* Validate Request Body Has Required Fields */
export const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    fields.forEach(field => {
      if (!req.body[field] && req.body[field] !== 0 && req.body[field] !== false) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        missingFields
      });
    }
    
    next();
  };
};

/* Validate MongoDB ObjectId */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    // MongoDB ObjectId is 24 hex characters
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    
    if (!objectIdRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

/* Sanitize User Input */
export const sanitizeInput = (req, res, next) => {
  // Remove any potential MongoDB operators from request body
  const removeOperators = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const cleaned = {};
    for (const key in obj) {
      // Skip keys that start with '$' (MongoDB operators)
      if (!key.startsWith('$')) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          cleaned[key] = removeOperators(obj[key]);
        } else {
          cleaned[key] = obj[key];
        }
      }
    }
    return cleaned;
  };
  
  req.body = removeOperators(req.body);
  next();
};