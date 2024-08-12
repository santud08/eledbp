import { celebrate, Joi } from "celebrate";

export const deleteSector = celebrate({
  body: Joi.object({
    id: Joi.number().required(),
    award_id: Joi.number().required(),
  }),
});
