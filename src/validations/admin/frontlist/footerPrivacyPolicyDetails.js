import { celebrate, Joi } from "celebrate";

export const footerPrivacyPolicyDetails = celebrate({
  body: Joi.object({
    page_type: Joi.string().required().valid("privacy-policy", "terms-of-service", "about-us"),
    page_id: Joi.number().required(),
  }),
});
