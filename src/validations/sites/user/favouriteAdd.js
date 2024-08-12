import { celebrate, Joi } from "celebrate";

export const favouriteAdd = celebrate({
  body: Joi.object({
    id: Joi.number().required(),
    type: Joi.string().optional().valid("title", "people", "award"),
  }),
});
