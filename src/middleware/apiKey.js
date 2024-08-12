import { envs, StatusError } from "../config/index.js";

/**
 * This function is used for validating X-API-KEY header
 */
export const validateApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) {
      throw StatusError.forbidden("");
    }
    if (envs.apiKey !== apiKey) {
      throw StatusError.forbidden("");
    }
    const acceptLanguage = req.headers["accept-language"] ? req.headers["accept-language"] : "en";
    req["accept_language"] = acceptLanguage;
    next();
  } catch (error) {
    next(error);
  }
};
