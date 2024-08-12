import { celebrate, Joi } from "celebrate";
export const ottServiceProvider = celebrate({
  query: Joi.object({
    site_language: Joi.string().optional(),
    type: Joi.string().optional().valid("movie", "tv", "webtoons").allow("", null),
  }),
});
