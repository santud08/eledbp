import { celebrate, Joi } from "celebrate";
export const editPeopleMediaRequestList = celebrate({
  body: Joi.object({
    people_id: Joi.number().required(),
    draft_request_id: Joi.number().optional().allow(""),
    site_language: Joi.string().required(),
    media_type: Joi.string().required().valid("video", "image"),
  }),
});
