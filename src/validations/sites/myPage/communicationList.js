import { celebrate, Joi } from "celebrate";
export const communicationList = celebrate({
  body: Joi.object({
    communication_type: Joi.string().required().valid("comment", "trivia", "famous_line", "goofs"),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    is_first: Joi.string().required().valid("y", "n"),
  }),
});
