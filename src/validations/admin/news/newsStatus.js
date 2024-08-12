import { celebrate, Joi } from "celebrate";

export const newsStatus = celebrate({
  body: Joi.object({
    news_id: Joi.number().required(),
    status: Joi.string().required().valid("active", "inactive"),
  }),
});
