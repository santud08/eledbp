import { celebrate, Joi } from "celebrate";
export const jobTitleList = celebrate({
  query: Joi.object({
    site_language: Joi.string().required(),
  }),
});
