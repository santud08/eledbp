import { celebrate, Joi } from "celebrate";
export const messageDelete = celebrate({
  body: Joi.object({
    message_id: Joi.number().required(),
    id: Joi.number().optional().allow("", null),
  }),
});
