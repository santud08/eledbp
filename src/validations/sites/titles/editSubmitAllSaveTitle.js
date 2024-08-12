import { celebrate, Joi } from "celebrate";
export const editSubmitAllSaveTitle = celebrate({
  body: Joi.object({
    draft_relation_id: Joi.number().required(),
    title_id: Joi.number().required(),
    title_type: Joi.string().required().valid("movie", "tv", "webtoons"),
  }),
});
