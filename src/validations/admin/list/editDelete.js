import { celebrate, Joi } from "celebrate";

export const editDelete = celebrate({
  body: Joi.object({
    edit_id: Joi.number().required(),
  }),
});
