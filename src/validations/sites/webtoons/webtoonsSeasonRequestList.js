import { celebrate, Joi } from "celebrate";

export const webtoonsSeasonRequestList = celebrate({
  query: Joi.object({
    draft_request_id: Joi.number().required(),
    site_language: Joi.string().required(),
  }),
});
