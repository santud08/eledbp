import { celebrate, Joi } from "celebrate";
export const workList = celebrate({
  body: Joi.object({
    person_id: Joi.number().required(),
    title_type: Joi.string().required().valid("movie", "tv", "webtoons"),
    list_type: Joi.string().required().valid("cast", "crew"),
  }),
});
