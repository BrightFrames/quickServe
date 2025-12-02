/**
 * Rate Limiting Middleware for Production API Protection
 * 
 * Purpose:
 * - Prevent brute force attacks on authentication endpoints
 * - Protect against spam and abuse on order/payment endpoints
 * - Ensure fair usage and system stability under load
 * 
 * Rate Limit Strategy:
 * - STRICT limits for auth (signup/login) - prevent credential stuffing
 * - MODERATE limits for orders - prevent spam orders
 * - STRICT limits for payments - prevent duplicate transactions
 * - RELAXED limits for general API - allow normal browsing
 */

import rateLimit from "express-rate-limit";
import { createLogger } from "./logger.js";

const logger = createLogger("RateLimit");

/**
 * Custom rate limit handler - logs violations and returns structured error
 */
const rateLimitHandler = (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  const path = req.originalUrl;
  
  logger.warn(`Rate limit exceeded`, {
    ip,
    path,
    userAgent: req.get("user-agent"),
  });

  res.status(429).json({
    success: false,
    message: "Too many requests. Please try again later.",
    error: "RATE_LIMIT_EXCEEDED",
    retryAfter: req.rateLimit?.resetTime
      ? new Date(req.rateLimit.resetTime).toISOString()
      : "15 minutes",
  });
};

/**
 * STRICT: Restaurant Signup Rate Limiter
 * 
 * Why strict?
 * - Prevent spam restaurant registrations
 * - Protect database from abuse
 * - Verify legitimate business signups
 * 
 * Limit: 5 signups per IP per 15 minutes
 */
export const signupRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many signup attempts. Please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip rate limiting for localhost in development
    const isLocalhost = req.ip === "127.0.0.1" || req.ip === "::1";
    return process.env.NODE_ENV === "development" && isLocalhost;
  },
});

/**
 * STRICT: Authentication Login Rate Limiter
 * 
 * Why strict?
 * - Prevent brute force password attacks
 * - Protect against credential stuffing
 * - Slow down automated login attempts
 * 
 * Limit: 10 login attempts per IP per 15 minutes
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: "Too many login attempts. Please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: true, // Don't count successful logins
  skip: (req) => {
    const isLocalhost = req.ip === "127.0.0.1" || req.ip === "::1";
    return process.env.NODE_ENV === "development" && isLocalhost;
  },
});

/**
 * MODERATE: Order Creation Rate Limiter
 * 
 * Why moderate?
 * - Prevent spam orders from malicious users
 * - Protect kitchen from fake order flooding
 * - Allow legitimate high-volume restaurants
 * 
 * Limit: 30 orders per IP per minute
 */
export const orderRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: "Too many orders. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => {
    const isLocalhost = req.ip === "127.0.0.1" || req.ip === "::1";
    return process.env.NODE_ENV === "development" && isLocalhost;
  },
});

/**
 * STRICT: Payment Endpoint Rate Limiter
 * 
 * Why strict?
 * - Prevent duplicate payment processing
 * - Protect against payment fraud attempts
 * - Ensure payment gateway stability
 * 
 * Limit: 10 payment requests per IP per minute
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: "Too many payment requests. Please wait a moment.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => {
    const isLocalhost = req.ip === "127.0.0.1" || req.ip === "::1";
    return process.env.NODE_ENV === "development" && isLocalhost;
  },
});

/**
 * RELAXED: General API Rate Limiter
 * 
 * Why relaxed?
 * - Allow normal browsing and menu viewing
 * - Don't interfere with legitimate customer usage
 * - Protect against massive automated scraping
 * 
 * Limit: 100 requests per IP per minute
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: "Too many requests. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => {
    const isLocalhost = req.ip === "127.0.0.1" || req.ip === "::1";
    return process.env.NODE_ENV === "development" && isLocalhost;
  },
});

/**
 * MODERATE: Table Management Rate Limiter
 * 
 * Why moderate?
 * - Captains frequently check table status
 * - Allow quick table updates
 * - Prevent abuse of table locking
 * 
 * Limit: 50 requests per IP per minute
 */
export const tableRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute
  message: "Too many table operations. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => {
    const isLocalhost = req.ip === "127.0.0.1" || req.ip === "::1";
    return process.env.NODE_ENV === "development" && isLocalhost;
  },
});

logger.info("Rate limiters initialized", {
  signup: "5 per 15min",
  login: "10 per 15min",
  orders: "30 per min",
  payments: "10 per min",
  general: "100 per min",
  tables: "50 per min",
});
