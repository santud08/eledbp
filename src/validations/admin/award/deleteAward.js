import { celebrate, Joi } from "celebrate";

export const deleteAward = celebrate({
  body: Joi.object({
    award_id: Joi.number().required(),
  }),
});
