import { celebrate, Joi } from "celebrate";
export const titleStatusList = celebrate({
  query: Joi.object({
    type: Joi.string().optional().valid("movie", "tv", "webtoons"),
  }),
});
