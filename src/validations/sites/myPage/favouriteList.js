import { celebrate, Joi } from "celebrate";
export const favouriteList = celebrate({
  body: Joi.object({
    list_type: Joi.string().required().valid("favorite", "rating", "shared"),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    is_first: Joi.string().required().valid("y", "n"),
  }),
});
