import { celebrate, Joi } from "celebrate";

export const deAllocateEditor = celebrate({
  body: Joi.object({
    edit_id: Joi.array().items(Joi.number().required()),
    user_id: Joi.number().allow(null).allow("").optional(),
  }),
});
