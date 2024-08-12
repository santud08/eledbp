import { celebrate, Joi } from "celebrate";

export const priorityList = celebrate({
  query: Joi.object({
    list_type: Joi.string().required().valid("movie", "tv", "webtoons", "people"),
  }),
});
