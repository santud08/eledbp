import { celebrate, Joi } from "celebrate";

export const deleteNominees = celebrate({
  body: Joi.object({
    award_id: Joi.number().required(),
    round_id: Joi.number().required(),
    nominee_id: Joi.number().required(),
  }),
});
