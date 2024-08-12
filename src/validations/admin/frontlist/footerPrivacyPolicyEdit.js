import { celebrate, Joi } from "celebrate";

export const footerPrivacyPolicyEdit = celebrate({
  body: Joi.object({
    page_type: Joi.string().required().valid("privacy-policy", "terms-of-service", "about-us"),
    page_id: Joi.number().required(),
    title: Joi.string().required(),
    date: Joi.date().iso().required(),
    content: Joi.string().required(),
    language: Joi.string().optional().valid("en", "ko").allow("", null),
  }),
});
