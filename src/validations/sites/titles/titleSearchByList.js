import { celebrate, Joi } from "celebrate";
export const titleSearchByList = celebrate({
  query: Joi.object({
    type: Joi.string().optional().valid("movie", "tv", "webtoons", "people"),
  }),
});
