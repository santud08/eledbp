import { celebrate, Joi } from "celebrate";

export const tagDetails = celebrate({
  query: Joi.object({
    tag_id: Joi.number().required(),
  }),
});
