import { celebrate, Joi } from "celebrate";

export const footerPrivacyPolicyList = celebrate({
  body: Joi.object({
    page_type: Joi.string().required().valid("privacy-policy", "terms-of-service", "about-us"),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
