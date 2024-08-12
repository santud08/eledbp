import { celebrate, Joi } from "celebrate";

export const ratingAdd = celebrate({
  body: Joi.object({
    id: Joi.number().required(),
    rating: Joi.number().required(),
    type: Joi.string().optional().valid("title", "people", "award"),
  }),
});
