import { celebrate, Joi } from "celebrate";

export const sharedDetails = celebrate({
  body: Joi.object({
    type: Joi.string().required().valid("title", "people", "award"),
    shared_id: Joi.number().required(),
    shared_channel: Joi.string().required().valid("facebook", "twitter", "mail", "link"),
  }),
});
