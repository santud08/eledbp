import { celebrate, Joi } from "celebrate";

export const operationAdd = celebrate({
  body: Joi.object({
    edit_id: Joi.number().required(),
    title_id: Joi.number().required(),
    operation: Joi.string().required().valid("", null, "allocate", "working", "done", "approve"),
  }),
});
