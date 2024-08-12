import { celebrate, Joi } from "celebrate";
export const communicationDelete = celebrate({
  body: Joi.object({
    communication_type: Joi.string().required().valid("comment", "trivia", "famous_line", "goofs"),
    id: Joi.number().required(),
  }),
});
