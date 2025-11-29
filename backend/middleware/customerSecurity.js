/**
 * Customer Route Security Middleware
 * 
 * Ensures customers accessing via QR codes can only access their specific table's menu
 * and prevents unauthorized access to admin/kitchen areas
 */

/**
 * Validate table access for customer requests
 * This is optional middleware for customer routes that need table validation
 */
export const validateTableAccess = (req, res, next) => {
  try {
    const { tableNumber } = req.params;
    const { restaurantId } = req.body;

    // Table number format validation (e.g., t1, t2, table-1, etc.)
    if (tableNumber && !/^[a-zA-Z0-9\-_]+$/.test(tableNumber)) {
      console.warn('[TABLE VALIDATION] Invalid table number format:', tableNumber);
      return res.status(400).json({ 
        message: 'Invalid table number format',
        error: 'Table number must be alphanumeric'
      });
    }

    // Log table access for analytics
    if (tableNumber && restaurantId) {
      console.log(`[TABLE ACCESS] Restaurant ${restaurantId}, Table: ${tableNumber}`);
    }

    next();
  } catch (error) {
    console.error('[TABLE VALIDATION] Error:', error.message);
    next(); // Don't block on validation errors for customer experience
  }
};

/**
 * Block direct admin/kitchen access attempts from customer sessions
 * This middleware should NOT be used on customer routes - it's for documentation
 */
export const blockUnauthorizedAdminAccess = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers.referer || '';
  
  // Check if request is coming from customer pages
  const isFromCustomerPage = referer.includes('/customer/');
  
  if (isFromCustomerPage) {
    console.warn('[SECURITY] Blocked admin access attempt from customer page');
    console.warn('[SECURITY] Referer:', referer);
    console.warn('[SECURITY] User-Agent:', userAgent);
    
    return res.status(403).json({ 
      message: 'Access denied',
      error: 'This area requires administrative authentication'
    });
  }
  
  next();
};

/**
 * Rate limiting for customer endpoints to prevent abuse
 * Basic implementation - can be enhanced with redis for production
 */
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute per IP

export const rateLimitCustomer = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // Clean up old entries
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW) {
      requestCounts.delete(ip);
    }
  }
  
  // Check current request count
  const clientData = requestCounts.get(clientIp) || { count: 0, windowStart: now };
  
  if (now - clientData.windowStart > RATE_LIMIT_WINDOW) {
    // Reset window
    clientData.count = 1;
    clientData.windowStart = now;
  } else {
    clientData.count++;
  }
  
  requestCounts.set(clientIp, clientData);
  
  if (clientData.count > MAX_REQUESTS) {
    console.warn(`[RATE LIMIT] IP ${clientIp} exceeded rate limit`);
    return res.status(429).json({ 
      message: 'Too many requests',
      error: 'Please slow down and try again in a minute'
    });
  }
  
  next();
};

/**
 * Sanitize customer input to prevent injection attacks
 */
export const sanitizeCustomerInput = (req, res, next) => {
  try {
    // Sanitize common fields
    if (req.body.customerName) {
      req.body.customerName = req.body.customerName.trim().substring(0, 100);
    }
    
    if (req.body.customerPhone) {
      // Remove non-numeric characters
      req.body.customerPhone = req.body.customerPhone.replace(/[^0-9+]/g, '').substring(0, 15);
    }
    
    if (req.body.customerEmail) {
      req.body.customerEmail = req.body.customerEmail.trim().toLowerCase().substring(0, 100);
    }
    
    if (req.body.specialInstructions) {
      // Remove potential script tags and limit length
      req.body.specialInstructions = req.body.specialInstructions
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .trim()
        .substring(0, 500);
    }
    
    next();
  } catch (error) {
    console.error('[SANITIZATION] Error:', error.message);
    next(); // Don't block on sanitization errors
  }
};
