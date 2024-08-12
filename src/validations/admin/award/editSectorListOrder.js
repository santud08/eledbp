import { celebrate, Joi } from "celebrate";

export const editSectorListOrder = celebrate({
  body: Joi.object({
    award_id: Joi.number().required(),
    sector_id_order: Joi.array().items(Joi.number().required()).required(),
  }),
});
