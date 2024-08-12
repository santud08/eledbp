import { celebrate, Joi } from "celebrate";

export const sectorDetails = celebrate({
  query: Joi.object({
    id: Joi.number().required(),
    award_id: Joi.number().required(),
  }),
});
