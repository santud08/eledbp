import { celebrate, Joi } from "celebrate";
export const editList = celebrate({
  body: Joi.object({
    search_type: Joi.string()
      .allow(null)
      .allow("")
      .optional()
      .valid("movie", "tv", "webtoons", "people"),
    search_title: Joi.string().optional().allow(null).allow(""),
    search_email: Joi.string().optional().allow(null).allow(""),
    content_id: Joi.number().optional().allow(null).allow(""),
    search_title_status: Joi.string()
      .allow(null)
      .allow("")
      .optional()
      .valid(
        "returning_series",
        "planned",
        "pilot",
        "in_production",
        "ended",
        "canceled",
        "rumored",
        "post_production",
        "released",
        "ongoing",
        "hiatus",
        "completed",
      ),
    search_editor_name: Joi.string().optional().allow(null).allow(""),
    search_date_type: Joi.string()
      .optional()
      .allow(null, "")
      .valid("modified_date", "registration_date"),
    search_start_date: Joi.optional().allow(null).allow(""),
    search_end_date: Joi.optional().allow(null).allow(""),
    search_operation: Joi.string()
      .allow(null)
      .allow("")
      .optional()
      .valid("allocate", "working", "done", "approve"),
    sort_order: Joi.string().optional().valid("", "desc", "asc"),
    sort_by: Joi.string().optional().allow(null).allow(""),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
