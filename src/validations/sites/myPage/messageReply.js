import { celebrate, Joi } from "celebrate";
export const messageReply = celebrate({
  body: Joi.object({
    message_id: Joi.number().required(),
    user_id: Joi.number().required(),
    friend_id: Joi.number().required(),
    is_reply: Joi.string().required().valid("y", "n"),
    message: Joi.string().required(),
  }),
});
