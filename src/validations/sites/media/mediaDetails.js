import { celebrate, Joi } from "celebrate";
export const mediaDetails = celebrate({
  body: Joi.object({
    id: Joi.number().required(),
    type: Joi.string().required().valid("video", "image", "poster", "cast", "crew"),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
