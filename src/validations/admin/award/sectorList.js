import { celebrate, Joi } from "celebrate";

export const sectorList = celebrate({
  query: Joi.object({
    award_id: Joi.number().required(),
    search_text: Joi.string().required().allow("", null),
  }),
});
