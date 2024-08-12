import { celebrate, Joi } from "celebrate";
export const searchPeople = celebrate({
  body: Joi.object({
    search_type: Joi.string().required().valid("title", "tmdb_id", "kobis_id", "imdb_id", "odk_id"),
    search_text: Joi.string().required(),
    sort_by: Joi.string().required().valid("newest", "oldest"),
    page: Joi.number().required(),
    limit: Joi.number().required(),
  }),
});
