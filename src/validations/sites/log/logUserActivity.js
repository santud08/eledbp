import { celebrate, Joi } from "celebrate";
export const logUserActivity = celebrate({
  body: Joi.object({
    id: Joi.number().required(),
    type: Joi.string().required().valid("title", "people", "video", "tag"),
    user_session_id: Joi.string().required(),
  }),
});
