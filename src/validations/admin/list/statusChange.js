import { celebrate, Joi } from "celebrate";

export const statusChange = celebrate({
  body: Joi.object({
    edit_id: Joi.number().required(),
    type: Joi.string().required().valid("movie", "tv", "webtoons", "people"),
  }),
});
