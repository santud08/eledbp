import { celebrate, Joi } from "celebrate";
export const peopleMediaRequestList = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().required(),
    site_language: Joi.string().required(),
    media_type: Joi.string().required().valid("video", "image"),
  }),
});