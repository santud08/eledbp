import { celebrate, Joi } from "celebrate";

export const videoList = celebrate({
  query: Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    type: Joi.string().optional().allow("", null).valid("newest", "trailer"),
  }),
});
