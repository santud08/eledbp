import { celebrate, Joi } from "celebrate";
export const editUploadPosterImage = celebrate({
  body: Joi.object({
    title_id: Joi.number().optional().allow("", null),
    draft_request_id: Joi.number().optional().allow("", null),
    is_main_poster: Joi.string().optional().valid("y", "n"),
  }),
});
