import { celebrate, Joi } from "celebrate";

export const deleteTag = celebrate({
  body: Joi.object({
    tag_id: Joi.number().required(),
  }),
});
