import { celebrate, Joi } from "celebrate";

export const checkTitleEditor = celebrate({
  body: Joi.object({
    edit_id: Joi.array().items(Joi.number().required()).optional(),
  }),
});
