import { celebrate, Joi } from "celebrate";
export const certificationList = celebrate({
  query: Joi.object({
    type: Joi.string().optional().valid("movie", "tv", "webtoons"),
  }),
});
