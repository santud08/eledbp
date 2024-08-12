import { celebrate, Joi } from "celebrate";
export const mediaList = celebrate({
  body: Joi.object({
    list_type: Joi.string().required().valid("video", "image", "poster"),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    is_first: Joi.string().required().valid("y", "n"),
  }),
});
