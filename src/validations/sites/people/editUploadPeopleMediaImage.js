import { celebrate, Joi } from "celebrate";
export const editUploadPeopleMediaImage = celebrate({
  body: Joi.object({
    people_id: Joi.number().required(),
    draft_request_id: Joi.number().optional().allow("", null),
    site_language: Joi.string().required(),
    images: Joi.string().optional().allow("", null),
  }),
});
