import { celebrate, Joi } from "celebrate";
export const companyDetails = celebrate({
  body: Joi.object({
    company_id: Joi.number().required(),
    type: Joi.string().required().valid("information", "artist"),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
