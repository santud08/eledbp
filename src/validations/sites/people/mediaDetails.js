import { celebrate, Joi } from "celebrate";
export const mediaDetails = celebrate({
  body: Joi.object({
    person_id: Joi.number().required(),
    type: Joi.string().required().valid("video", "image"),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
