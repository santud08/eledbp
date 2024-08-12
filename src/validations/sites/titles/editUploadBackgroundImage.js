import { celebrate, Joi } from "celebrate";
export const editUploadBackgroundImage = celebrate({
  body: Joi.object({
    title_id: Joi.number().optional().allow("", null),
    draft_request_id: Joi.number().optional().allow("", null),
    site_language: Joi.string().required(),
    image: Joi.string().optional().allow("", null),
  }),
});
