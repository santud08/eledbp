import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import { validateApiKey } from "../../middleware/index.js";
import { siteValidation } from "../../validations/index.js";

const authRouter = Router();

authRouter.post(
  "/signup",
  validateApiKey,
  siteValidation.authValidation.userSignup,
  siteController.authController.signup,
);

authRouter.post(
  "/check-email",
  validateApiKey,
  siteValidation.authValidation.checkEmail,
  siteController.authController.checkEmail,
);

authRouter.post(
  "/email-verify",
  validateApiKey,
  siteValidation.authValidation.emailVerify,
  siteController.authController.emailVerify,
);

authRouter.post(
  "/send-reset-verification-code",
  validateApiKey,
  siteValidation.authValidation.sendVerificationCodeToEmail,
  siteController.authController.sendVerificationCodeToEmail,
);

authRouter.post(
  "/check-verification-code",
  validateApiKey,
  siteValidation.authValidation.checkVerificationCode,
  siteController.authController.checkVerificationCode,
);

authRouter.post(
  "/setting-password",
  validateApiKey,
  siteValidation.authValidation.settingPassword,
  siteController.authController.settingPassword,
);

authRouter.post(
  "/login",
  validateApiKey,
  siteValidation.authValidation.userLogin,
  siteController.authController.login,
);

export { authRouter };
