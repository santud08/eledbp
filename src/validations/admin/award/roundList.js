import { celebrate, Joi } from "celebrate";

export const roundList = celebrate({
  query: Joi.object({
    award_id: Joi.number().required(),
    search_text: Joi.string().optional().allow("", null),
  }),
});
