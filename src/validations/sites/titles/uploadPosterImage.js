import { celebrate, Joi } from "celebrate";
export const uploadPosterImage = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().required(),
    is_main_poster: Joi.string().optional().valid("y", "n"),
  }),
});
