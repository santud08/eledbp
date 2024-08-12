import { celebrate, Joi } from "celebrate";
export const editUploadImage = celebrate({
  body: Joi.object({
    title_id: Joi.number().optional().allow("", null),
    draft_request_id: Joi.number().optional().allow("", null),
  }),
});
