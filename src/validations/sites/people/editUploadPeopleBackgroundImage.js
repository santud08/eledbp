import { celebrate, Joi } from "celebrate";
export const editUploadPeopleBackgroundImage = celebrate({
  body: Joi.object({
    people_id: Joi.number().required(),
    draft_request_id: Joi.number().optional().allow("", null),
    site_language: Joi.string().optional().allow("", null),
    image: Joi.string().optional().allow("", null),
  }),
});
