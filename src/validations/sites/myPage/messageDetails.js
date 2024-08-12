import { celebrate, Joi } from "celebrate";
export const messageDetails = celebrate({
  query: Joi.object({
    message_id: Joi.number().required(),
  }),
});
