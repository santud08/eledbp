import { celebrate, Joi } from "celebrate";

export const updateView = celebrate({
  body: Joi.object({
    video_id: Joi.number().required(),
    user_session_id: Joi.string().required(),
  }),
});
